const OutboundOrder = require('../models/OutboundOrder');
const Product = require('../models/Product');

// 创建出库单
exports.createOutboundOrder = async (req, res) => {
  try {
    const order = await OutboundOrder.create(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 获取所有出库单
exports.getAllOutboundOrders = async (req, res) => {
  try {
    const orders = await OutboundOrder.findAll({
      include: [{ model: Product }]
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 获取单个出库单
exports.getOutboundOrderById = async (req, res) => {
  try {
    const order = await OutboundOrder.findByPk(req.params.id, {
      include: [{ model: Product }]
    });
    if (order) {
      res.status(200).json(order);
    } else {
      res.status(404).json({ error: 'Outbound order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 更新出库单
exports.updateOutboundOrder = async (req, res) => {
  try {
    const order = await OutboundOrder.findByPk(req.params.id);
    if (order) {
      await order.update(req.body);
      res.status(200).json(order);
    } else {
      res.status(404).json({ error: 'Outbound order not found' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 删除出库单
exports.deleteOutboundOrder = async (req, res) => {
  try {
    const order = await OutboundOrder.findByPk(req.params.id);
    if (order) {
      await order.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Outbound order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 