const { PurchaseOrder, PurchaseOrderItem } = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { generatePurchaseOrderNo } = require('../utils/orderUtils');
const Supplier = require('../models/Supplier');
const { InboundOrder, InboundType } = require('../models/InboundOrder');
const { createInboundOrderService } = require('../services/inboundOrderService');
const logger = require('../services/loggerService');

// 创建采购订单
exports.createPurchaseOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    console.log('接收到的请求数据:', JSON.stringify(req.body, null, 2));
    
    const {
      supplierId,
      orderDate,
      expectedArrivalDate,
      paymentMethod,
      operator,
      remark,
      items
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('采购商品明细不能为空', 400));
    }

    // 生成采购单号
    const orderNo = generatePurchaseOrderNo();

    // 计算总金额和总数量
    let totalAmount = 0;
    let totalQuantity = 0;
    items.forEach(item => {
      const quantity = parseInt(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      totalAmount += quantity * unitPrice;
      totalQuantity += quantity;
    });

    console.log('计算结果:', { totalAmount, totalQuantity, items });

    // 创建采购订单
    const purchaseOrder = await PurchaseOrder.create({
      orderNo,
      supplierId,
      orderDate,
      expectedArrivalDate,
      status: 'PENDING',
      totalAmount,
      totalQuantity,
      paymentMethod,
      operator,
      remark
    }, { transaction });

    // 创建采购订单明细
    const orderItems = items.map(item => ({
      purchaseOrderId: purchaseOrder.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice
    }));

    await PurchaseOrderItem.bulkCreate(orderItems, { transaction });

    await transaction.commit();

    res.status(201).json({
      status: 'success',
      message: '采购订单创建成功',
      data: {
        purchaseOrder,
        items: orderItems
      }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('创建采购订单失败:', error);
    next(new AppError('创建采购订单失败', 500));
  }
};

// 确认采购订单
exports.confirmPurchaseOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findByPk(id, {
      include: [
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'code', 'specification', 'unit']
          }]
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name']
        }
      ],
      transaction
    });

    if (!purchaseOrder) {
      await transaction.rollback();
      return next(new AppError('采购订单不存在', 404));
    }

    if (purchaseOrder.status !== 'PENDING') {
      await transaction.rollback();
      return next(new AppError('只能确认未确认状态的采购订单', 400));
    }

    // 确认采购订单
    await purchaseOrder.update({
      status: 'CONFIRMED'
    }, { transaction });

    // 准备入库单数据
    const inboundItems = purchaseOrder.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      unit: item.product?.unit || ''
    }));

    // 使用入库单服务创建入库单（包含库存更新和流水记录）
    const { order: inboundOrder } = await createInboundOrderService({
      type: InboundType.PURCHASE,
      operator: purchaseOrder.operator,
      remark: `采购订单${purchaseOrder.orderNo}自动生成的入库单`,
      items: inboundItems,
      orderDate: new Date(),
      relatedOrderId: purchaseOrder.id // 关联采购单ID
    }, transaction);

    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: '采购订单确认成功，已自动生成入库单并更新库存',
      data: {
        purchaseOrder,
        inboundOrder: {
          id: inboundOrder.id,
          orderNo: inboundOrder.orderNo,
          type: inboundOrder.type,
          totalAmount: inboundOrder.totalAmount,
          totalQuantity: inboundOrder.totalQuantity
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('确认采购订单失败:', error);
    next(new AppError('确认采购订单失败', 500));
  }
};

// 删除采购订单
exports.deletePurchaseOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findByPk(id, {
      include: [
        {
          model: PurchaseOrderItem,
          as: 'items'
        }
      ],
      transaction
    });

    if (!purchaseOrder) {
      await transaction.rollback();
      return next(new AppError('采购订单不存在', 404));
    }

    // 如果订单已确认，检查是否有关联的入库单，如果有则不允许删除
    if (purchaseOrder.status === 'CONFIRMED') {
      // 查找关联的采购入库单（通过关联订单ID）
      const relatedInboundOrders = await InboundOrder.findAll({
        where: {
          type: InboundType.PURCHASE,
          relatedOrderId: purchaseOrder.id
        },
        transaction
      });

      if (relatedInboundOrders.length > 0) {
        await transaction.rollback();
        return next(new AppError(`采购订单已确认且存在关联的入库单，无法删除。请先删除相关入库单：${relatedInboundOrders.map(order => order.orderNo).join(', ')}`, 400));
      }
    }

    // 删除采购订单（关联的PurchaseOrderItem会通过CASCADE自动删除）
    await purchaseOrder.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: '采购订单删除成功',
      data: {
        deletedPurchaseOrderId: id
      }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('删除采购订单失败:', error);
    next(new AppError('删除采购订单失败', 500));
  }
};

// 获取采购订单列表
exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, orderNo, status, supplierId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    console.log('查询参数:', { orderNo, status, supplierId, startDate, endDate });

    // 构建查询条件
    const where = {};
    
    // 订单编号模糊查询
    if (orderNo && orderNo.trim()) {
      where.orderNo = {
        [Op.like]: `%${orderNo.trim()}%`
      };
    }
    
    // 状态筛选
    if (status && status.trim()) {
      where.status = status.trim();
    }
    
    // 供应商筛选
    if (supplierId && supplierId.trim()) {
      where.supplierId = parseInt(supplierId.trim());
    }
    
    // 日期范围筛选
    if (startDate && startDate.trim() && endDate && endDate.trim()) {
      where.orderDate = {
        [Op.between]: [startDate.trim(), endDate.trim()]
      };
    }

    console.log('构建的查询条件:', where);

    // 查询订单列表 - 不包含商品明细
    const { count, rows: orders } = await PurchaseOrder.findAndCountAll({
      where,
      include: [
        {
          model: Supplier,
          attributes: ['id', 'name'],
          as: 'supplier'
        }
      ],
      order: [['createdAt', 'DESC']],
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

    res.json({
      status: 'success',
      data: {
        items: orders,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('获取采购订单列表失败:', error);
    next(new AppError('获取采购订单列表失败', 500));
  }
};

// 获取采购订单商品明细
exports.getPurchaseOrderItems = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // 先检查采购订单是否存在
    const order = await PurchaseOrder.findByPk(req.params.id);
    if (!order) {
      return next(new AppError('采购订单不存在', 404));
    }

    // 获取关联商品列表
    const { count, rows } = await PurchaseOrderItem.findAndCountAll({
      where: { purchaseOrderId: req.params.id },
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'code', 'specification', 'unit', 'brand', 'purchasePrice', 'retailPrice']
      }],
      order: [['createdAt', 'ASC']],
      offset,
      limit
    });

    res.status(200).json({
      status: 'success',
      message: '获取采购订单商品明细成功',
      data: {
        orderInfo: {
          id: order.id,
          orderNo: order.orderNo,
          status: order.status,
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
    logger.error('获取采购订单商品明细失败:', error);
    next(new AppError('获取采购订单商品明细失败', 500));
  }
}; 