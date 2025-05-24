const StocktakingOrder = require('../models/StocktakingOrder');
const { InboundOrder, InboundType, InboundTypeDisplay } = require('../models/InboundOrder');
const { OutboundOrder, OutboundType, OutboundTypeDisplay } = require('../models/OutboundOrder');
const Product = require('../models/Product');
const { Message, MessageType, MessageTypeDisplay } = require('../models/Message');

// 创建盘点单
exports.createStocktakingOrder = async (req, res) => {
  try {
    const { productId, actualQuantity, recordedQuantity, operator } = req.body;
    const stocktakingOrder = await StocktakingOrder.create(req.body);

    // 自动创建出入库单
    if (actualQuantity > recordedQuantity) {
      // 盘盈，创建入库单
      const inboundOrder = await InboundOrder.create({
        type: InboundType.STOCK_IN,
        productId,
        quantity: actualQuantity - recordedQuantity,
        operator
      });

      // 创建盘盈入库消息
      await Message.create({
        content: `盘盈入库：商品ID ${productId} 盘盈数量为 ${actualQuantity - recordedQuantity}。`,
        type: MessageType.STOCK_IN,
        relatedId: inboundOrder.id
      });
    } else if (actualQuantity < recordedQuantity) {
      // 盘亏，创建出库单
      const outboundOrder = await OutboundOrder.create({
        type: OutboundType.STOCK_OUT,
        productId,
        quantity: recordedQuantity - actualQuantity,
        operator
      });

      // 创建盘亏出库消息
      await Message.create({
        content: `盘亏出库：商品ID ${productId} 盘亏数量为 ${recordedQuantity - actualQuantity}。`,
        type: MessageType.STOCK_OUT,
        relatedId: outboundOrder.id
      });
    }

    res.status(201).json(stocktakingOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 获取所有盘点单
exports.getAllStocktakingOrders = async (req, res) => {
  try {
    const orders = await StocktakingOrder.findAll({
      include: [{ model: Product }]
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 获取单个盘点单
exports.getStocktakingOrderById = async (req, res) => {
  try {
    const order = await StocktakingOrder.findByPk(req.params.id, {
      include: [{ model: Product }]
    });
    if (order) {
      res.status(200).json(order);
    } else {
      res.status(404).json({ error: 'Stocktaking order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 更新盘点单
exports.updateStocktakingOrder = async (req, res) => {
  try {
    const order = await StocktakingOrder.findByPk(req.params.id);
    if (order) {
      await order.update(req.body);
      res.status(200).json(order);
    } else {
      res.status(404).json({ error: 'Stocktaking order not found' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 删除盘点单
exports.deleteStocktakingOrder = async (req, res) => {
  try {
    const order = await StocktakingOrder.findByPk(req.params.id);
    if (order) {
      await order.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Stocktaking order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 