const { OutboundOrder } = require('../models/OutboundOrder');
const { OrderItem, OrderItemType } = require('../models/OrderItem');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { createOutboundOrderService, deleteOutboundOrderService, checkStockAlertAndCreateMessage } = require('../services/outboundOrderService');
const logger = require('../services/loggerService');

// 创建出库单
exports.createOutboundOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { type, remark, operator, items, orderDate } = req.body;
    
    // 使用出库单服务创建出库单
    const result = await createOutboundOrderService({
      type,
      operator,
      remark,
      items,
      orderDate,
      enableStockAlert: true
    }, transaction);

    await transaction.commit();

    // 检查库存预警（在事务提交后）
    if (result.enableStockAlert && result.updatedInventories && result.updatedInventories.length > 0) {
      await checkStockAlertAndCreateMessage(result.updatedInventories, operator, result.order.orderNo);
    }

    res.status(201).json({
      status: 'success',
      message: '出库单创建成功，库存已更新',
      data: {
        ...result.order.dataValues,
        items: result.items
      }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('创建出库单失败:', error);
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
    logger.error('获取出库单列表失败:', error);
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
    logger.error('获取出库单失败:', error);
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
    logger.error('更新出库单失败:', error);
    next(new AppError(error.message || '更新出库单失败', 400));
  }
};

// 删除出库单
exports.deleteOutboundOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    // 使用出库单服务删除出库单
    await deleteOutboundOrderService(req.params.id, transaction);

    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: '出库单删除成功，库存已恢复'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('删除出库单失败:', error);
    next(new AppError(error.message || '删除出库单失败', 500));
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
    logger.error('获取出库单关联商品失败:', error);
    next(new AppError('获取出库单关联商品失败', 500));
  }
}; 