const InboundOrder = require('../models/InboundOrder');
const Product = require('../models/Product');

// 创建入库单
exports.createInboundOrder = async (req, res) => {
  try {
    const order = await InboundOrder.create(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 获取所有入库单
exports.getAllInboundOrders = async (req, res) => {
  try {
    const orders = await InboundOrder.findAll({
      include: [{ model: Product }]
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 获取单个入库单
exports.getInboundOrderById = async (req, res) => {
  try {
    const order = await InboundOrder.findByPk(req.params.id, {
      include: [{ model: Product }]
    });
    if (order) {
      res.status(200).json(order);
    } else {
      res.status(404).json({ error: 'Inbound order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 更新入库单
exports.updateInboundOrder = async (req, res) => {
  try {
    const order = await InboundOrder.findByPk(req.params.id);
    if (order) {
      await order.update(req.body);
      res.status(200).json(order);
    } else {
      res.status(404).json({ error: 'Inbound order not found' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 删除入库单
exports.deleteInboundOrder = async (req, res) => {
  try {
    const order = await InboundOrder.findByPk(req.params.id);
    if (order) {
      await order.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Inbound order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 