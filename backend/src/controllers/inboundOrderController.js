const InboundOrder = require('../models/InboundOrder');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');

// 创建入库单
exports.createInboundOrder = async (req, res, next) => {
  try {
    const order = await InboundOrder.create(req.body);
    res.status(201).json({
      status: 'success',
      message: '入库单创建成功',
      data: order
    });
  } catch (error) {
    next(new AppError('创建入库单失败', 400));
  }
};

// 获取所有入库单
exports.getAllInboundOrders = async (req, res, next) => {
  try {
    const orders = await InboundOrder.findAll({
      include: [{ model: Product }]
    });
    res.status(200).json({
      status: 'success',
      message: '获取入库单列表成功',
      data: orders
    });
  } catch (error) {
    next(new AppError('获取入库单列表失败', 500));
  }
};

// 获取单个入库单
exports.getInboundOrderById = async (req, res, next) => {
  try {
    const order = await InboundOrder.findByPk(req.params.id, {
      include: [{ model: Product }]
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
    next(new AppError('获取入库单失败', 500));
  }
};

// 更新入库单
exports.updateInboundOrder = async (req, res, next) => {
  try {
    const order = await InboundOrder.findByPk(req.params.id);
    if (!order) {
      return next(new AppError('入库单不存在', 404));
    }
    
    await order.update(req.body);
    res.status(200).json({
      status: 'success',
      message: '入库单更新成功',
      data: order
    });
  } catch (error) {
    next(new AppError('更新入库单失败', 400));
  }
};

// 删除入库单
exports.deleteInboundOrder = async (req, res, next) => {
  try {
    const order = await InboundOrder.findByPk(req.params.id);
    if (!order) {
      return next(new AppError('入库单不存在', 404));
    }
    
    await order.destroy();
    res.status(200).json({
      status: 'success',
      message: '入库单删除成功'
    });
  } catch (error) {
    next(new AppError('删除入库单失败', 500));
  }
}; 