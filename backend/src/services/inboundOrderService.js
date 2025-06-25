const { InboundOrder } = require('../models/InboundOrder');
const { OrderItem, OrderItemType } = require('../models/OrderItem');
const Inventory = require('../models/Inventory');
const InventoryLog = require('../models/InventoryLog');
const { generateInboundOrderNo } = require('../utils/orderUtils');
const logger = require('./loggerService');

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
    logger.error('更新库存失败:', error);
    throw error;
  }
};

/**
 * 创建入库单（通用服务函数）
 * @param {Object} params - 入库单参数
 * @param {string} params.type - 入库类型
 * @param {string} params.operator - 操作员
 * @param {string} params.remark - 备注
 * @param {Array} params.items - 商品明细
 * @param {Date} params.orderDate - 入库日期
 * @param {string} params.orderNo - 入库单号（可选，不传则自动生成）
 * @param {Object} transaction - 数据库事务
 * @returns {Object} 创建的入库单和明细
 */
const createInboundOrderService = async (params, transaction) => {
  const { type, operator, remark, items, orderDate, orderNo } = params;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('入库商品明细不能为空');
  }

  // 生成或使用传入的入库单号
  const finalOrderNo = orderNo || generateInboundOrderNo();

  // 计算总数量和总金额
  let totalQuantity = 0;
  let totalAmount = 0;

  for (const item of items) {
    totalQuantity += item.quantity || 0;
    totalAmount += (item.quantity || 0) * (item.unitPrice || 0);
  }

  // 创建入库单
  const order = await InboundOrder.create({
    orderNo: finalOrderNo,
    type,
    totalAmount,
    totalQuantity,
    operator,
    remark,
    orderDate: orderDate ? new Date(orderDate) : new Date()
  }, { transaction });

  // 创建商品明细
  const orderItems = items.map(item => ({
    orderType: OrderItemType.INBOUND,
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
        item.quantity, // 入库为正数
        '入库',
        finalOrderNo,
        operator,
        transaction
      );
    }
  }

  return {
    order,
    items: orderItems
  };
};

/**
 * 删除入库单及相关库存记录（通用服务函数）
 * @param {number} inboundOrderId - 入库单ID
 * @param {Object} transaction - 数据库事务
 * @returns {boolean} 删除成功标识
 */
const deleteInboundOrderService = async (inboundOrderId, transaction) => {
  const order = await InboundOrder.findByPk(inboundOrderId, {
    include: [{
      model: OrderItem,
      as: 'items'
    }],
    transaction
  });

  if (!order) {
    throw new Error('入库单不存在');
  }

  // 撤销库存变更
  for (const item of order.items) {
    if (item.quantity > 0) {
      await updateInventoryAndLog(
        item.productId,
        -item.quantity, // 撤销入库，所以是负数
        '入库撤销',
        order.orderNo,
        order.operator,
        transaction
      );
    }
  }

  // 删除商品明细
  await OrderItem.destroy({
    where: {
      orderType: OrderItemType.INBOUND,
      orderId: order.id
    },
    transaction
  });

  // 删除入库单
  await order.destroy({ transaction });

  return true;
};

module.exports = {
  createInboundOrderService,
  deleteInboundOrderService,
  updateInventoryAndLog
}; 