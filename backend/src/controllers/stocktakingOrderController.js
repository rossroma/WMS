const StocktakingOrder = require('../models/StocktakingOrder');
const { InboundOrder, InboundType, InboundTypeDisplay } = require('../models/InboundOrder');
const { OutboundOrder, OutboundType, OutboundTypeDisplay } = require('../models/OutboundOrder');
const { OrderItem, OrderItemType } = require('../models/OrderItem');
const Product = require('../models/Product');
const { Message, MessageType, MessageTypeDisplay } = require('../models/Message');
const { AppError } = require('../middleware/errorHandler');
const sequelize = require('../config/database');
const { generateInboundOrderNo, generateOutboundOrderNo } = require('../utils/orderUtils');

// 创建盘点单
exports.createStocktakingOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { productId, actualQuantity, recordedQuantity, operator } = req.body;
    const stocktakingOrder = await StocktakingOrder.create(req.body, { transaction });

    // 自动创建出入库单
    if (actualQuantity > recordedQuantity) {
      // 盘盈，创建入库单
      const orderNo = generateInboundOrderNo();
      const inboundOrder = await InboundOrder.create({
        orderNo,
        type: InboundType.STOCK_IN,
        totalQuantity: actualQuantity - recordedQuantity,
        totalAmount: 0,
        operator
      }, { transaction });

      // 创建入库明细
      await OrderItem.create({
        orderType: OrderItemType.INBOUND,
        orderId: inboundOrder.id,
        productId,
        quantity: actualQuantity - recordedQuantity,
        unitPrice: 0,
        totalPrice: 0
      }, { transaction });

      // 创建盘盈入库消息
      await Message.create({
        content: `盘盈入库：商品ID ${productId} 盘盈数量为 ${actualQuantity - recordedQuantity}。`,
        type: MessageType.STOCK_IN,
        relatedId: inboundOrder.id
      }, { transaction });
    } else if (actualQuantity < recordedQuantity) {
      // 盘亏，创建出库单
      const orderNo = generateOutboundOrderNo();
      const outboundOrder = await OutboundOrder.create({
        orderNo,
        type: OutboundType.STOCK_OUT,
        totalQuantity: recordedQuantity - actualQuantity,
        totalAmount: 0,
        operator
      }, { transaction });

      // 创建出库明细
      await OrderItem.create({
        orderType: OrderItemType.OUTBOUND,
        orderId: outboundOrder.id,
        productId,
        quantity: recordedQuantity - actualQuantity,
        unitPrice: 0,
        totalPrice: 0
      }, { transaction });

      // 创建盘亏出库消息
      await Message.create({
        content: `盘亏出库：商品ID ${productId} 盘亏数量为 ${recordedQuantity - actualQuantity}。`,
        type: MessageType.STOCK_OUT,
        relatedId: outboundOrder.id
      }, { transaction });
    }

    await transaction.commit();

    res.status(201).json({
      status: 'success',
      message: '盘点单创建成功',
      data: stocktakingOrder
    });
  } catch (error) {
    await transaction.rollback();
    console.error('创建盘点单失败:', error);
    next(new AppError('创建盘点单失败', 400));
  }
};

// 获取所有盘点单
exports.getAllStocktakingOrders = async (req, res, next) => {
  try {
    const orders = await StocktakingOrder.findAll({
      include: [{ model: Product }]
    });
    res.status(200).json({
      status: 'success',
      message: '获取盘点单列表成功',
      data: orders
    });
  } catch (error) {
    next(new AppError('获取盘点单列表失败', 500));
  }
};

// 获取单个盘点单
exports.getStocktakingOrderById = async (req, res, next) => {
  try {
    const order = await StocktakingOrder.findByPk(req.params.id, {
      include: [{ model: Product }]
    });
    if (!order) {
      return next(new AppError('盘点单不存在', 404));
    }
    
    res.status(200).json({
      status: 'success',
      message: '获取盘点单成功',
      data: order
    });
  } catch (error) {
    next(new AppError('获取盘点单失败', 500));
  }
};

// 更新盘点单
exports.updateStocktakingOrder = async (req, res, next) => {
  try {
    const order = await StocktakingOrder.findByPk(req.params.id);
    if (!order) {
      return next(new AppError('盘点单不存在', 404));
    }
    
    await order.update(req.body);
    res.status(200).json({
      status: 'success',
      message: '盘点单更新成功',
      data: order
    });
  } catch (error) {
    next(new AppError('更新盘点单失败', 400));
  }
};

// 删除盘点单
exports.deleteStocktakingOrder = async (req, res, next) => {
  try {
    const order = await StocktakingOrder.findByPk(req.params.id);
    if (!order) {
      return next(new AppError('盘点单不存在', 404));
    }
    
    await order.destroy();
    res.status(200).json({
      status: 'success',
      message: '盘点单删除成功'
    });
  } catch (error) {
    next(new AppError('删除盘点单失败', 500));
  }
}; 