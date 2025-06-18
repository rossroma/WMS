const { InboundOrder } = require('../models/InboundOrder');
const { OrderItem, OrderItemType } = require('../models/OrderItem');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const InventoryLog = require('../models/InventoryLog');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { createInboundOrderService, deleteInboundOrderService } = require('../services/inboundOrderService');

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

// 创建入库单
exports.createInboundOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { type, remark, operator, items, orderDate } = req.body;
    
    // 使用入库单服务创建入库单
    const result = await createInboundOrderService({
      type,
      operator,
      remark,
      items,
      orderDate
    }, transaction);

    await transaction.commit();

    res.status(201).json({
      status: 'success',
      message: '入库单创建成功，库存已更新',
      data: {
        ...result.order.dataValues,
        items: result.items
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('创建入库单失败:', error);
    next(new AppError(error.message || '创建入库单失败', 400));
  }
};

// 获取所有入库单
exports.getAllInboundOrders = async (req, res, next) => {
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

    const { count, rows } = await InboundOrder.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    res.status(200).json({
      status: 'success',
      message: '获取入库单列表成功',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: limit
      }
    });
  } catch (error) {
    console.error('获取入库单列表失败:', error);
    next(new AppError('获取入库单列表失败', 500));
  }
};

// 获取单个入库单
exports.getInboundOrderById = async (req, res, next) => {
  try {
    const order = await InboundOrder.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            attributes: ['id', 'name', 'specification', 'unit', 'purchasePrice']
          }]
        }
      ]
    });

    if (!order) {
      return next(new AppError('入库单不存在', 404));
    }
    
    res.status(200).json({
      status: 'success',
      message: '获取入库单成功',
      data: order
    });
  } catch (error) {
    console.error('获取入库单失败:', error);
    next(new AppError('获取入库单失败', 500));
  }
};

// 更新入库单
exports.updateInboundOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const order = await InboundOrder.findByPk(req.params.id, { transaction });
    
    if (!order) {
      await transaction.rollback();
      return next(new AppError('入库单不存在', 404));
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
      message: '入库单更新成功',
      data: order
    });
  } catch (error) {
    await transaction.rollback();
    console.error('更新入库单失败:', error);
    next(new AppError('更新入库单失败', 400));
  }
};

// 删除入库单
exports.deleteInboundOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    // 使用入库单服务删除入库单
    await deleteInboundOrderService(req.params.id, transaction);

    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: '入库单删除成功，库存已回退'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('删除入库单失败:', error);
    next(new AppError(error.message || '删除入库单失败', 500));
  }
};

// 获取入库单关联商品列表
exports.getInboundOrderItems = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    // 先检查入库单是否存在
    const order = await InboundOrder.findByPk(req.params.id);
    if (!order) {
      return next(new AppError('入库单不存在', 404));
    }

    // 获取关联商品列表
    const { count, rows } = await OrderItem.findAndCountAll({
      where: {
        orderType: OrderItemType.INBOUND,
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
      message: '获取入库单关联商品成功',
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
    console.error('获取入库单关联商品失败:', error);
    next(new AppError('获取入库单关联商品失败', 500));
  }
}; 