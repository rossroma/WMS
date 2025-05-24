const OutboundOrder = require('../models/OutboundOrder');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');

// 创建出库单
exports.createOutboundOrder = async (req, res, next) => {
  try {
    const order = await OutboundOrder.create(req.body);
    res.status(201).json({
      status: 'success',
      message: '出库单创建成功',
      data: order
    });
  } catch (error) {
    next(new AppError('创建出库单失败', 400));
  }
};

// 获取所有出库单
exports.getAllOutboundOrders = async (req, res, next) => {
  try {
    const orders = await OutboundOrder.findAll({
      include: [{ model: Product }]
    });
    res.status(200).json({
      status: 'success',
      message: '获取出库单列表成功',
      data: orders
    });
  } catch (error) {
    next(new AppError('获取出库单列表失败', 500));
  }
};

// 获取单个出库单
exports.getOutboundOrderById = async (req, res, next) => {
  try {
    const order = await OutboundOrder.findByPk(req.params.id, {
      include: [{ model: Product }]
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
    next(new AppError('获取出库单失败', 500));
  }
};

// 更新出库单
exports.updateOutboundOrder = async (req, res, next) => {
  try {
    const order = await OutboundOrder.findByPk(req.params.id);
    if (!order) {
      return next(new AppError('出库单不存在', 404));
    }
    
    await order.update(req.body);
    res.status(200).json({
      status: 'success',
      message: '出库单更新成功',
      data: order
    });
  } catch (error) {
    next(new AppError('更新出库单失败', 400));
  }
};

// 删除出库单
exports.deleteOutboundOrder = async (req, res, next) => {
  try {
    const order = await OutboundOrder.findByPk(req.params.id);
    if (!order) {
      return next(new AppError('出库单不存在', 404));
    }
    
    await order.destroy();
    res.status(200).json({
      status: 'success',
      message: '出库单删除成功'
    });
  } catch (error) {
    next(new AppError('删除出库单失败', 500));
  }
}; 