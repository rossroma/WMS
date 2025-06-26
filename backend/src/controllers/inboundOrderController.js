const { InboundOrder } = require('../models/InboundOrder');
const { OrderItem, OrderItemType } = require('../models/OrderItem');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { createInboundOrderService, deleteInboundOrderService } = require('../services/inboundOrderService');
const logger = require('../services/loggerService');

// 创建入库单
exports.createInboundOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { type, remark, operator, items, orderDate } = req.body;
    
    // 手动创建入库单时，不允许设置关联订单ID
    const result = await createInboundOrderService({
      type,
      operator,
      remark,
      items,
      orderDate,
      relatedOrderId: null // 手动创建的入库单不设置关联ID
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
    logger.error('创建入库单失败:', error);
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

    // 根据入库单类型分别加载关联关系
    const { InboundType } = require('../models/InboundOrder');
    const { PurchaseOrder } = require('../models/PurchaseOrder');
    const { StocktakingOrder } = require('../models/StocktakingOrder');

    for (const row of rows) {
      if (row.relatedOrderId) {
        if (row.type === InboundType.PURCHASE) {
          // 采购入库：关联采购单
          const purchaseOrder = await PurchaseOrder.findByPk(row.relatedOrderId, {
            attributes: ['id', 'orderNo']
          });
          row.dataValues.relatedPurchaseOrder = purchaseOrder;
          row.dataValues.relatedStocktakingOrder = null;
        } else if (row.type === InboundType.STOCK_IN) {
          // 盘盈入库：关联盘点单
          const stocktakingOrder = await StocktakingOrder.findByPk(row.relatedOrderId, {
            attributes: ['id', 'orderNo']
          });
          row.dataValues.relatedStocktakingOrder = stocktakingOrder;
          row.dataValues.relatedPurchaseOrder = null;
        } else {
          // 其他类型：无关联
          row.dataValues.relatedPurchaseOrder = null;
          row.dataValues.relatedStocktakingOrder = null;
        }
      } else {
        // 无关联订单
        row.dataValues.relatedPurchaseOrder = null;
        row.dataValues.relatedStocktakingOrder = null;
      }
    }

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
    logger.error('获取入库单列表失败:', error);
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
    logger.error('获取入库单失败:', error);
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

    // 只更新基本信息，不允许更新商品明细、汇总数据和关联订单ID
    await order.update({
      type,
      remark,
      operator,
      orderDate: orderDate ? new Date(orderDate) : order.orderDate
      // 注意：不更新relatedOrderId字段，保持原有关联关系
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: '入库单更新成功',
      data: order
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('更新入库单失败:', error);
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
    logger.error('删除入库单失败:', error);
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
    logger.error('获取入库单关联商品失败:', error);
    next(new AppError('获取入库单关联商品失败', 500));
  }
}; 