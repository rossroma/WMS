const Message = require('../models/Message');
const { Op } = require('sequelize');
const { AppError } = require('../middleware/errorHandler');

// 查看所有消息
exports.getAllMessages = async (req, res, next) => {
  try {
    const messages = await Message.findAll();
    res.status(200).json({
      status: 'success',
      message: '获取消息列表成功',
      data: messages
    });
  } catch (error) {
    next(new AppError('获取消息列表失败', 500));
  }
};

// 新增消息
exports.createMessage = async (req, res, next) => {
  try {
    const message = await Message.create(req.body);
    res.status(201).json({
      status: 'success',
      message: '消息创建成功',
      data: message
    });
  } catch (error) {
    next(new AppError('创建消息失败', 400));
  }
};

// 定期删除超过3个月的消息
exports.deleteOldMessages = async () => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    await Message.destroy({
      where: {
        createdAt: {
          [Op.lt]: threeMonthsAgo
        }
      }
    });
  } catch (error) {
    console.error('Error deleting old messages:', error);
  }
}; 