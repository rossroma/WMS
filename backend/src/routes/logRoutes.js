const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticate, hasRole } = require('../middleware/auth');

// 获取日志列表
router.get('/', authenticate, hasRole(['admin']), logController.getLogs);

// 导出日志
router.get('/export', authenticate, hasRole(['admin']), logController.exportLogs);

module.exports = router; 