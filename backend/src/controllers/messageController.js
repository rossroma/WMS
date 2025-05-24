const Message = require('../models/Message');
const { Op } = require('sequelize');

// 查看所有消息
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.findAll();
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 新增消息
exports.createMessage = async (req, res) => {
  try {
    const message = await Message.create(req.body);
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
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