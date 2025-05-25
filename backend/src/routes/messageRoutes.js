const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

// 应用认证中间件
router.use(authenticate);

// 获取消息列表（支持分页和筛选）
router.get('/', messageController.getMessages);

// 获取未读消息列表
router.get('/unread', messageController.getUnreadMessages);

// 获取未读消息数量
router.get('/unread-count', messageController.getUnreadCount);

// 标记消息为已读
router.put('/:id/read', messageController.markAsRead);

// 标记所有消息为已读
router.put('/read-all', messageController.markAllAsRead);

module.exports = router; 