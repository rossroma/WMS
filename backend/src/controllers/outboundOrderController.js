const { OutboundOrder } = require('../models/OutboundOrder');
const { OrderItem, OrderItemType } = require('../models/OrderItem');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const InventoryLog = require('../models/InventoryLog');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { generateOutboundOrderNo } = require('../utils/orderUtils');

// 更新库存数量并生成库存日志
const updateInventoryAndLog = async (productId, quantityChange, type, relatedDocument, operator, transaction) => {
  try {
    // 查找库存记录
    let inventory = await Inventory.findOne({
      where: { productId },
      transaction
    });

    if (!inventory) {
      // 如果是出库操作且库存记录不存在，报错
      if (quantityChange < 0) {
        throw new Error(`商品ID ${productId} 的库存记录不存在，无法出库`);
      }
      // 如果是入库操作，创建新的库存记录
      inventory = await Inventory.create({
        productId,
        quantity: Math.max(0, quantityChange)
      }, { transaction });
    } else {
      // 更新现有库存
      const newQuantity = inventory.quantity + quantityChange;
      
      // 检查库存是否足够（出库时）
      if (newQuantity < 0) {
        throw new Error(`商品ID ${productId} 库存不足，当前库存：${inventory.quantity}，需要出库：${Math.abs(quantityChange)}`);
      }
      
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

// 创建出库单
exports.createOutboundOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { type, remark, operator, items, orderDate } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('出库商品明细不能为空', 400));
    }

    // 生成出库单号
    const orderNo = generateOutboundOrderNo();

    // 计算总数量和总金额
    let totalQuantity = 0;
    let totalAmount = 0;
    
    for (const item of items) {
      totalQuantity += item.quantity || 0;
      totalAmount += (item.quantity || 0) * (item.unitPrice || 0);
    }

    // 验证库存是否足够
    for (const item of items) {
      if (item.quantity > 0) {
        const inventory = await Inventory.findOne({
          where: { productId: item.productId },
          transaction
        });
        
        if (!inventory) {
          await transaction.rollback();
          return next(new AppError(`商品ID ${item.productId} 的库存记录不存在`, 400));
        }
        
        if (inventory.quantity < item.quantity) {
          await transaction.rollback();
          return next(new AppError(`商品ID ${item.productId} 库存不足，当前库存：${inventory.quantity}，需要出库：${item.quantity}`, 400));
        }
      }
    }

    // 创建出库单
    const order = await OutboundOrder.create({
      orderNo,
      type,
      totalAmount,
      totalQuantity,
      operator,
      remark,
      orderDate: orderDate ? new Date(orderDate) : new Date()
    }, { transaction });

    // 创建商品明细
    const orderItems = items.map(item => ({
      orderType: OrderItemType.OUTBOUND,
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice || 0,
      totalPrice: (item.quantity || 0) * (item.unitPrice || 0),
      unit: item.unit
    }));

    await OrderItem.bulkCreate(orderItems, { transaction });

    // 更新库存数量并生成库存流水
    for (const item of items) {
      if (item.quantity > 0) {
        await updateInventoryAndLog(
          item.productId,
          -item.quantity, // 出库为负数
          '出库',
          orderNo,
          operator,
          transaction
        );
      }
    }

    await transaction.commit();

    res.status(201).json({
      status: 'success',
      message: '出库单创建成功，库存已更新',
      data: {
        ...order.dataValues,
        items: orderItems
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('创建出库单失败:', error);
    next(new AppError(error.message || '创建出库单失败', 400));
  }
};

// 获取所有出库单
exports.getAllOutboundOrders = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, type, orderNo, startDate, endDate } = req.query;
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    // 构建查询条件
    const whereClause = {};
    if (type) whereClause.type = type;
    if (orderNo) whereClause.orderNo = { [Op.like]: `%${orderNo}%` };
    
    // 日期范围筛选
    if (startDate && endDate) {
      whereClause.orderDate = {
        [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')]
      };
    } else if (startDate) {
      whereClause.orderDate = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.orderDate = {
        [Op.lte]: new Date(endDate + ' 23:59:59')
      };
    }

    const { count, rows } = await OutboundOrder.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    res.status(200).json({
      status: 'success',
      message: '获取出库单列表成功',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: limit
      }
    });
  } catch (error) {
    console.error('获取出库单列表失败:', error);
    next(new AppError('获取出库单列表失败', 500));
  }
};

// 获取单个出库单
exports.getOutboundOrderById = async (req, res, next) => {
  try {
    const order = await OutboundOrder.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            attributes: ['id', 'name', 'specification', 'unit', 'retailPrice']
          }]
        }
      ]
    });

    if (!order) {
      return next(new AppError('出库单不存在', 404));
    }
    
    res.status(200).json({
      status: 'success',
      message: '获取出库单成功',
      data: order
    });
  } catch (error) {
    console.error('获取出库单失败:', error);
    next(new AppError('获取出库单失败', 500));
  }
};

// 更新出库单
exports.updateOutboundOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const order = await OutboundOrder.findByPk(req.params.id, { transaction });
    
    if (!order) {
      await transaction.rollback();
      return next(new AppError('出库单不存在', 404));
    }

    const { type, remark, operator, orderDate } = req.body;

    // 只更新基本信息，不允许更新商品明细和汇总数据
    await order.update({
      type,
      remark,
      operator,
      orderDate: orderDate ? new Date(orderDate) : order.orderDate
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: '出库单更新成功',
      data: order
    });
  } catch (error) {
    await transaction.rollback();
    console.error('更新出库单失败:', error);
    next(new AppError(error.message || '更新出库单失败', 400));
  }
};

// 删除出库单
exports.deleteOutboundOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const order = await OutboundOrder.findByPk(req.params.id, {
      include: [{
        model: OrderItem,
        as: 'items'
      }],
      transaction
    });
    
    if (!order) {
      await transaction.rollback();
      return next(new AppError('出库单不存在', 404));
    }

    // 撤销库存变更（恢复库存）
    for (const item of order.items) {
      if (item.quantity > 0) {
        await updateInventoryAndLog(
          item.productId,
          item.quantity, // 撤销出库，恢复库存，所以是正数
          '出库撤销',
          order.orderNo,
          order.operator,
          transaction
        );
      }
    }

    // 删除商品明细
    await OrderItem.destroy({
      where: {
        orderType: OrderItemType.OUTBOUND,
        orderId: order.id
      },
      transaction
    });

    // 删除出库单
    await order.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: '出库单删除成功，库存已恢复'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('删除出库单失败:', error);
    next(new AppError('删除出库单失败', 500));
  }
};

// 获取出库单关联商品列表
exports.getOutboundOrderItems = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    // 先检查出库单是否存在
    const order = await OutboundOrder.findByPk(req.params.id);
    if (!order) {
      return next(new AppError('出库单不存在', 404));
    }

    // 获取关联商品列表
    const { count, rows } = await OrderItem.findAndCountAll({
      where: {
        orderType: OrderItemType.OUTBOUND,
        orderId: req.params.id
      },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'code', 'specification', 'unit', 'brand', 'purchasePrice', 'retailPrice']
      }],
      order: [['createdAt', 'ASC']],
      offset,
      limit
    });

    res.status(200).json({
      status: 'success',
      message: '获取出库单关联商品成功',
      data: {
        orderInfo: {
          id: order.id,
          orderNo: order.orderNo,
          type: order.type,
          orderDate: order.orderDate,
          operator: order.operator,
          totalQuantity: order.totalQuantity,
          totalAmount: order.totalAmount,
          remark: order.remark
        },
        items: rows,
        total: count,
        page: parseInt(page),
        pageSize: limit
      }
    });
  } catch (error) {
    console.error('获取出库单关联商品失败:', error);
    next(new AppError('获取出库单关联商品失败', 500));
  }
}; 