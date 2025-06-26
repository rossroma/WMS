const { StocktakingOrder } = require('../models/StocktakingOrder');
const { StocktakingItem } = require('../models/StocktakingItem');
const { InboundType } = require('../models/InboundOrder');
const { OutboundType } = require('../models/OutboundOrder');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

const MessageService = require('../services/messageService');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { generateStocktakingOrderNo, generateInboundOrderNo, generateOutboundOrderNo } = require('../utils/orderUtils');
const { createLog } = require('../services/logService');
const { LOG_MODULE, LOG_ACTION_TYPE } = require('../constants/logConstants');
const { createInboundOrderService } = require('../services/inboundOrderService');
const { createOutboundOrderService } = require('../services/outboundOrderService');
const logger = require('../services/loggerService');
const { InboundOrder } = require('../models/InboundOrder');
const { OutboundOrder } = require('../models/OutboundOrder');




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
    logger.error('获取盘点单列表失败:', error);
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
          throw new AppError(`商品不存在 (ID: ${item.productId})`, 400);
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
        
        // 构建入库单参数
        const inboundParams = {
          type: InboundType.STOCK_IN,
          operator,
          remark: `盘点单${orderNo}自动生成的盘盈入库`,
          items: profitItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unit: item.product.unit
          })),
          orderDate: stocktakingDate ? new Date(stocktakingDate) : new Date(),
          orderNo: inboundOrderNo,
          relatedOrderId: stocktakingOrder.id // 关联盘点单ID
        };
        
        // 使用服务创建入库单
        await createInboundOrderService(inboundParams, transaction);
        
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
          logger.error('记录盘盈入库单创建日志失败:', logError);
        }
      }
      
      // 创建盘亏出库单
      if (lossItems.length > 0) {
        outboundOrderNo = generateOutboundOrderNo();
        
        // 构建出库单参数
        const outboundParams = {
          type: OutboundType.STOCK_OUT,
          operator,
          remark: `盘点单${orderNo}自动生成的盘亏出库`,
          items: lossItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unit: item.product.unit
          })),
          orderDate: stocktakingDate ? new Date(stocktakingDate) : new Date(),
          orderNo: outboundOrderNo,
          relatedOrderId: stocktakingOrder.id, // 关联盘点单ID
          enableStockAlert: false // 盘亏出库不需要库存预警
        };
        
        // 使用服务创建出库单
        await createOutboundOrderService(outboundParams, transaction);
        
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
          logger.error('记录盘亏出库单创建日志失败:', logError);
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
      logger.error('记录盘点单创建日志失败:', logError);
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
      logger.error('创建消息通知失败:', messageError);
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
    logger.error('创建盘点单失败:', error);
    next(new AppError(error.message || '创建盘点单失败', 400));
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
    
    // 检查是否存在关联的盘盈入库单
    const relatedInboundOrders = await InboundOrder.findAll({
      where: {
        type: InboundType.STOCK_IN,
        relatedOrderId: order.id
      },
      transaction
    });

    // 检查是否存在关联的盘亏出库单
    const relatedOutboundOrders = await OutboundOrder.findAll({
      where: {
        type: OutboundType.STOCK_OUT,
        relatedOrderId: order.id
      },
      transaction
    });

    // 如果存在关联的出入库单，则不允许删除
    if (relatedInboundOrders.length > 0 || relatedOutboundOrders.length > 0) {
      await transaction.rollback();
      
      const relatedOrders = [];
      if (relatedInboundOrders.length > 0) {
        relatedOrders.push(`入库单：${relatedInboundOrders.map(inboundOrder => inboundOrder.orderNo).join(', ')}`);
      }
      if (relatedOutboundOrders.length > 0) {
        relatedOrders.push(`出库单：${relatedOutboundOrders.map(outboundOrder => outboundOrder.orderNo).join(', ')}`);
      }
      
      return next(new AppError(`盘点单存在关联的出入库单，无法删除。请先删除相关单据：${relatedOrders.join('；')}`, 400));
    }
    
    // 删除盘点单（关联的StocktakingItem会通过CASCADE自动删除）
    await order.destroy({ transaction });

    await transaction.commit();
    
    res.status(200).json({
      status: 'success',
      message: '盘点单删除成功',
      data: {
        deletedStocktakingOrderId: req.params.id
      }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('删除盘点单失败:', error);
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
    logger.error('获取盘点商品明细失败:', error);
    next(new AppError('获取盘点商品明细失败', 500));
  }
};
