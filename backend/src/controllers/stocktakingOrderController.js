const { StocktakingOrder } = require('../models/StocktakingOrder');
const { StocktakingItem } = require('../models/StocktakingItem');
const { InboundOrder, InboundType } = require('../models/InboundOrder');
const { OutboundOrder, OutboundType } = require('../models/OutboundOrder');
const { OrderItem, OrderItemType } = require('../models/OrderItem');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const InventoryLog = require('../models/InventoryLog');
const MessageService = require('../services/messageService');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { generateStocktakingOrderNo, generateInboundOrderNo, generateOutboundOrderNo } = require('../utils/orderUtils');
const { createLog } = require('../services/logService');
const { LOG_MODULE, LOG_ACTION_TYPE } = require('../constants/logConstants');

// 更新库存数量并生成库存日志
const updateInventoryAndLog = async (productId, quantityChange, type, relatedDocument, operator, transaction) => {
  try {
    // 查找或创建库存记录
    let inventory = await Inventory.findOne({
      where: { productId },
      transaction
    });

    if (!inventory) {
      // 如果库存记录不存在，创建新的库存记录
      inventory = await Inventory.create({
        productId,
        quantity: Math.max(0, quantityChange) // 确保库存不为负数
      }, { transaction });
    } else {
      // 更新现有库存
      const newQuantity = Math.max(0, inventory.quantity + quantityChange);
      await inventory.update({
        quantity: newQuantity
      }, { transaction });
    }

    // 创建库存流水记录
    await InventoryLog.create({
      inventoryId: inventory.id,
      changeQuantity: quantityChange,
      type,
      relatedDocument,
      operator
    }, { transaction });

    return inventory;
  } catch (error) {
    console.error('更新库存失败:', error);
    throw error;
  }
};

// 获取盘点单列表
exports.getStocktakingOrders = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      orderNo,
      operator,
      startDate,
      endDate
    } = req.query;

    // 构建查询条件
    const where = {};
    
    if (orderNo) {
      where.orderNo = { [Op.like]: `%${orderNo}%` };
    }
    
    if (operator) {
      where.operator = { [Op.like]: `%${operator}%` };
    }
    
    if (startDate && endDate) {
      where.stocktakingDate = {
        [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')]
      };
    } else if (startDate) {
      where.stocktakingDate = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      where.stocktakingDate = {
        [Op.lte]: new Date(endDate + ' 23:59:59')
      };
    }

    // 计算分页参数
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    // 查询盘点单列表
    const { count, rows } = await StocktakingOrder.findAndCountAll({
      where,
      include: [{
        model: StocktakingItem,
        as: 'items',
        required: false
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      message: '获取盘点单列表成功',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取盘点单列表失败:', error);
    next(new AppError('获取盘点单列表失败', 500));
  }
};

// 创建盘点单
exports.createStocktakingOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { stocktakingDate, operator, remark, items = [] } = req.body;
    
    // 输入验证
    if (!operator) {
      return next(new AppError('操作员不能为空', 400));
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('盘点商品明细不能为空', 400));
    }
    
    // 检查是否有重复的商品
    const productIds = items.map(item => item.productId);
    const uniqueProductIds = [...new Set(productIds)];
    if (productIds.length !== uniqueProductIds.length) {
      return next(new AppError('盘点商品中存在重复商品', 400));
    }
    
    // 生成盘点单号
    const orderNo = generateStocktakingOrderNo();
    
    // 创建盘点单
    const stocktakingOrder = await StocktakingOrder.create({
      orderNo,
      stocktakingDate: stocktakingDate ? new Date(stocktakingDate) : new Date(),
      operator,
      remark,
      totalItems: items.length
    }, { transaction });

    // 创建盘点商品明细
    let inboundOrderNo = null;
    let outboundOrderNo = null;
    const profitItems = [];
    const lossItems = [];
    
    if (items.length > 0) {
      const stocktakingItems = [];
      
      for (const item of items) {
        // 获取商品信息
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) {
          throw new AppError(`商品ID ${item.productId} 不存在`, 400);
        }
        
        // 获取当前库存数量
        const inventory = await Inventory.findOne({
          where: { productId: item.productId },
          transaction
        });
        
        const systemQuantity = inventory ? inventory.quantity : 0;
        const actualQuantity = item.actualQuantity || 0;
        const difference = actualQuantity - systemQuantity;
        
        stocktakingItems.push({
          stocktakingOrderId: stocktakingOrder.id,
          productId: item.productId,
          productName: product.name,
          productCode: product.code,
          specification: product.specification || '',
          unit: product.unit,
          systemQuantity,
          actualQuantity
        });
        
        // 分类盘盈和盘亏商品
        if (difference > 0) {
          // 盘盈
          profitItems.push({
            productId: item.productId,
            product,
            quantity: difference,
            unitPrice: product.purchasePrice || 0,
            stocktakingItem: {
              actualQuantity,
              recordedQuantity: systemQuantity
            }
          });
        } else if (difference < 0) {
          // 盘亏
          lossItems.push({
            productId: item.productId,
            product,
            quantity: Math.abs(difference),
            unitPrice: product.retailPrice || 0,
            stocktakingItem: {
              actualQuantity,
              recordedQuantity: systemQuantity
            }
          });
        }
      }
      
      await StocktakingItem.bulkCreate(stocktakingItems, { transaction });
      
      // 创建盘盈入库单
      if (profitItems.length > 0) {
        inboundOrderNo = generateInboundOrderNo();
        const totalQuantity = profitItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = profitItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        
        const inboundOrder = await InboundOrder.create({
          orderNo: inboundOrderNo,
          type: InboundType.STOCK_IN,
          totalAmount,
          totalQuantity,
          operator,
          remark: `盘点单${orderNo}自动生成的盘盈入库`,
          orderDate: stocktakingDate ? new Date(stocktakingDate) : new Date()
        }, { transaction });
        
        // 创建入库商品明细
        const inboundItems = profitItems.map(item => ({
          orderType: OrderItemType.INBOUND,
          orderId: inboundOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          unit: item.product.unit
        }));
        
        await OrderItem.bulkCreate(inboundItems, { transaction });
        
        // 更新库存
        for (const item of profitItems) {
          await updateInventoryAndLog(
            item.productId,
            item.quantity,
            '盘盈入库',
            inboundOrderNo,
            operator,
            transaction
          );
        }
        try {
          await createLog({
            userId: null,
            username: '系统',
            actionType: LOG_ACTION_TYPE.CREATE,
            module: LOG_MODULE.STOCK_IN,
            ipAddress: req.ip,
            details: `系统自动创建盘盈入库单 ${inboundOrderNo} (关联盘点单: ${orderNo})`
          });
        } catch (logError) {
          console.error('记录盘盈入库单创建日志失败:', logError);
        }
      }
      
      // 创建盘亏出库单
      if (lossItems.length > 0) {
        outboundOrderNo = generateOutboundOrderNo();
        const totalQuantity = lossItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = lossItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        
        const outboundOrder = await OutboundOrder.create({
          orderNo: outboundOrderNo,
          type: OutboundType.STOCK_OUT,
          totalAmount,
          totalQuantity,
          operator,
          remark: `盘点单${orderNo}自动生成的盘亏出库`,
          orderDate: stocktakingDate ? new Date(stocktakingDate) : new Date()
        }, { transaction });
        
        // 创建出库商品明细
        const outboundItems = lossItems.map(item => ({
          orderType: OrderItemType.OUTBOUND,
          orderId: outboundOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          unit: item.product.unit
        }));
        
        await OrderItem.bulkCreate(outboundItems, { transaction });
        
        // 更新库存
        for (const item of lossItems) {
          await updateInventoryAndLog(
            item.productId,
            -item.quantity, // 出库为负数
            '盘亏出库',
            outboundOrderNo,
            operator,
            transaction
          );
        }
        try {
          await createLog({
            userId: null,
            username: '系统',
            actionType: LOG_ACTION_TYPE.CREATE,
            module: LOG_MODULE.STOCK_OUT,
            ipAddress: req.ip,
            details: `系统自动创建盘亏出库单 ${outboundOrderNo} (关联盘点单: ${orderNo})`
          });
        } catch (logError) {
          console.error('记录盘亏出库单创建日志失败:', logError);
        }
      }
    }

    await transaction.commit();

    // 记录创建盘点单日志
    try {
      let logUserId = null;
      let logUsername = '系统';

      if (req.user && req.user.id) {
        logUserId = req.user.id;
        logUsername = req.user.username;
      } else if (operator) {
        // 根据operatorId查找用户
        const userPerformingAction = await User.findByPk(operator);
        if (userPerformingAction) {
          logUserId = userPerformingAction.id;
          logUsername = userPerformingAction.username;
        }
      }

      await createLog({
        userId: logUserId,
        username: logUsername,
        actionType: LOG_ACTION_TYPE.CREATE,
        module: LOG_MODULE.INVENTORY,
        ipAddress: req.ip,
        details: `创建盘点单 ${orderNo} 成功，包含 ${items.length} 个品项。`
      });
    } catch (logError) {
      console.error('记录盘点单创建日志失败:', logError);
      // 日志记录失败不应影响主流程响应
    }

    // 创建消息通知（在事务提交后）
    try {
      // 创建盘盈入库消息
      for (const item of profitItems) {
        await MessageService.createStockInMessage(item.stocktakingItem, item.product, operator, inboundOrderNo);
      }
      
      // 创建盘亏出库消息
      for (const item of lossItems) {
        await MessageService.createStockOutMessage(item.stocktakingItem, item.product, operator, outboundOrderNo);
      }
    } catch (messageError) {
      console.error('创建消息通知失败:', messageError);
      // 消息创建失败不影响主流程
    }

    // 返回创建的盘点单（包含商品明细）
    const result = await StocktakingOrder.findByPk(stocktakingOrder.id, {
      include: [{
        model: StocktakingItem,
        as: 'items'
      }]
    });

    // 构建返回消息
    let message = '盘点单创建成功';
    const autoCreatedOrders = [];
    
    if (profitItems && profitItems.length > 0) {
      message += '，已自动创建盘盈入库单';
      autoCreatedOrders.push({
        type: '盘盈入库单',
        orderNo: inboundOrderNo,
        itemCount: profitItems.length
      });
    }
    
    if (lossItems && lossItems.length > 0) {
      message += '，已自动创建盘亏出库单';
      autoCreatedOrders.push({
        type: '盘亏出库单',
        orderNo: outboundOrderNo,
        itemCount: lossItems.length
      });
    }
    
    if (autoCreatedOrders.length > 0) {
      message += '，库存已同步更新';
    }

    res.status(201).json({
      status: 'success',
      message,
      data: {
        stocktakingOrder: result,
        autoCreatedOrders
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('创建盘点单失败:', error);
    next(new AppError(error.message || '创建盘点单失败', 400));
  }
};

// 获取盘点单详情
exports.getStocktakingOrderById = async (req, res, next) => {
  try {
    const order = await StocktakingOrder.findByPk(req.params.id, {
      include: [{
        model: StocktakingItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product'
        }]
      }]
    });
    
    if (!order) {
      return next(new AppError('盘点单不存在', 404));
    }
    
    res.status(200).json({
      status: 'success',
      message: '获取盘点单详情成功',
      data: order
    });
  } catch (error) {
    console.error('获取盘点单详情失败:', error);
    next(new AppError('获取盘点单详情失败', 500));
  }
};

// 删除盘点单
exports.deleteStocktakingOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const order = await StocktakingOrder.findByPk(req.params.id, { transaction });
    if (!order) {
      await transaction.rollback();
      return next(new AppError('盘点单不存在', 404));
    }
    
    // 删除盘点商品明细（由于设置了CASCADE，会自动删除）
    await order.destroy({ transaction });

    await transaction.commit();
    
    res.status(200).json({
      status: 'success',
      message: '盘点单删除成功'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('删除盘点单失败:', error);
    next(new AppError('删除盘点单失败', 500));
  }
};

// 获取盘点单的商品明细
exports.getStocktakingItems = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      pageSize = 10 
    } = req.query;

    // 计算分页参数
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    // 先检查盘点单是否存在
    const order = await StocktakingOrder.findByPk(req.params.id);
    if (!order) {
      return next(new AppError('盘点单不存在', 404));
    }

    // 查询盘点商品明细
    const { count, rows } = await StocktakingItem.findAndCountAll({
      where: { stocktakingOrderId: req.params.id },
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'code', 'specification', 'unit', 'brand', 'purchasePrice', 'retailPrice']
      }],
      limit,
      offset,
      order: [['createdAt', 'ASC']]
    });

    res.status(200).json({
      status: 'success',
      message: '获取盘点商品明细成功',
      data: {
        orderInfo: {
          id: order.id,
          orderNo: order.orderNo,
          stocktakingDate: order.stocktakingDate,
          operator: order.operator,
          totalItems: order.totalItems,
          remark: order.remark
        },
        items: rows,
        total: count,
        page: parseInt(page),
        pageSize: limit
      }
    });
  } catch (error) {
    console.error('获取盘点商品明细失败:', error);
    next(new AppError('获取盘点商品明细失败', 500));
  }
};

// 更新盘点商品的实际数量
exports.updateStocktakingItem = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { actualQuantity } = req.body;
    
    const item = await StocktakingItem.findByPk(req.params.itemId, { transaction });
    if (!item) {
      return next(new AppError('盘点商品不存在', 404));
    }
    
    // 更新盘点商品
    await item.update({
      actualQuantity
    }, { transaction });

    await transaction.commit();
    
    res.status(200).json({
      status: 'success',
      message: '盘点商品更新成功',
      data: item
    });
  } catch (error) {
    await transaction.rollback();
    console.error('更新盘点商品失败:', error);
    next(new AppError('更新盘点商品失败', 400));
  }
}; 