const { OutboundOrder } = require('../models/OutboundOrder');
const { OrderItem, OrderItemType } = require('../models/OrderItem');
const Inventory = require('../models/Inventory');
const InventoryLog = require('../models/InventoryLog');
const Product = require('../models/Product');
const MessageService = require('./messageService');
const { generateOutboundOrderNo } = require('../utils/orderUtils');
const { updateInventory } = require('./inboundOrderService');
const logger = require('./loggerService');

// 更新库存数量（出库专用，包含库存检查）
const updateInventoryForOutbound = async (productId, quantityChange, transaction) => {
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

    return inventory;
  } catch (error) {
    logger.error('更新库存失败:', error);
    throw error;
  }
};

// 创建库存流水（关联到库存表）
const createInventoryLog = async (inventoryId, orderItemId, quantityChange, type, relatedDocument, operator, transaction) => {
  try {
    // 创建库存流水记录
    await InventoryLog.create({
      inventoryId,
      orderItemId, // 可选，用于追溯业务来源
      changeQuantity: quantityChange,
      type,
      relatedDocument,
      operator
    }, { transaction });
  } catch (error) {
    logger.error('创建库存流水失败:', error);
    throw error;
  }
};

/**
 * 创建出库单（通用服务函数）
 * @param {Object} params - 出库单参数
 * @param {string} params.type - 出库类型
 * @param {string} params.operator - 操作员
 * @param {string} params.remark - 备注
 * @param {Array} params.items - 商品明细
 * @param {Date} params.orderDate - 出库日期
 * @param {string} params.orderNo - 出库单号（可选，不传则自动生成）
 * @param {number} params.relatedOrderId - 关联订单ID（可选，盘亏出库关联盘点单ID）
 * @param {Object} transaction - 数据库事务
 * @param {boolean} params.enableStockAlert - 是否启用库存预警检查（可选，默认true）
 * @returns {Object} 创建的出库单和明细
 */
const createOutboundOrderService = async (params, transaction) => {
  const { type, operator, remark, items, orderDate, orderNo, relatedOrderId, enableStockAlert = true } = params;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('出库商品明细不能为空');
  }

  // 生成或使用传入的出库单号
  const finalOrderNo = orderNo || generateOutboundOrderNo();

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
        throw new Error(`商品ID ${item.productId} 的库存记录不存在`);
      }
      
      if (inventory.quantity < item.quantity) {
        throw new Error(`商品ID ${item.productId} 库存不足，当前库存：${inventory.quantity}，需要出库：${item.quantity}`);
      }
    }
  }

  // 创建出库单
  const order = await OutboundOrder.create({
    orderNo: finalOrderNo,
    type,
    totalAmount,
    totalQuantity,
    operator,
    remark,
    orderDate: orderDate ? new Date(orderDate) : new Date(),
    relatedOrderId: relatedOrderId || null
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

  const createdOrderItems = await OrderItem.bulkCreate(orderItems, { transaction });

  // 更新库存数量并创建库存流水
  const updatedInventories = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const orderItem = createdOrderItems[i];
    
    if (item.quantity > 0) {
      // 更新库存
      const updatedInventory = await updateInventoryForOutbound(
        item.productId,
        -item.quantity, // 出库为负数
        transaction
      );
      
      // 创建库存流水
      await createInventoryLog(
        updatedInventory.id, // 库存ID
        orderItem.id,        // 订单明细ID（用于追溯）
        -item.quantity,      // 出库为负数
        '出库',
        finalOrderNo,
        operator,
        transaction
      );
      
      updatedInventories.push({
        inventory: updatedInventory,
        productId: item.productId
      });
    }
  }

  return {
    order,
    items: orderItems,
    updatedInventories,
    enableStockAlert
  };
};

/**
 * 删除出库单及相关库存记录（通用服务函数）
 * @param {number} outboundOrderId - 出库单ID
 * @param {Object} transaction - 数据库事务
 * @returns {boolean} 删除成功标识
 */
const deleteOutboundOrderService = async (outboundOrderId, transaction) => {
  const order = await OutboundOrder.findByPk(outboundOrderId, {
    include: [{
      model: OrderItem,
      as: 'items'
    }],
    transaction
  });

  if (!order) {
    throw new Error('出库单不存在');
  }

  // 撤销库存变更（恢复库存）
  for (const item of order.items) {
    if (item.quantity > 0) {
      await updateInventory(
        item.productId,
        item.quantity, // 撤销出库，恢复库存，所以是正数
        transaction
      );
    }
  }

  // 删除出库单（关联的OrderItem会通过CASCADE自动删除）
  await order.destroy({ transaction });

  return true;
};

/**
 * 检查库存预警并创建消息通知
 * @param {Array} updatedInventories - 更新的库存信息
 * @param {string} operator - 操作员
 * @param {string} orderNo - 订单号
 */
const checkStockAlertAndCreateMessage = async (updatedInventories, operator, orderNo) => {
  try {
    for (const { inventory, productId } of updatedInventories) {
      const product = await Product.findByPk(productId);
      if (product && product.stockAlertQuantity > 0 && inventory.quantity <= product.stockAlertQuantity) {
        await MessageService.createInventoryAlert(inventory, product, operator, orderNo);
      }
    }
  } catch (alertError) {
    logger.error('创建库存预警消息失败:', alertError);
    // 预警消息创建失败不影响主流程
  }
};

module.exports = {
  createOutboundOrderService,
  deleteOutboundOrderService,
  checkStockAlertAndCreateMessage,
  updateInventoryForOutbound,
  createInventoryLog
}; 