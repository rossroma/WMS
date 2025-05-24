const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// 消息路由
router.get('/messages', messageController.getAllMessages);
router.post('/messages', messageController.createMessage);

module.exports = router; 