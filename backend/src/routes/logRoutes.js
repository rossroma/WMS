const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticate, hasRole } = require('../middleware/auth');

// 获取日志列表 (需要认证和授权，例如仅管理员可查看)
router.get('/', authenticate, hasRole(['admin']), logController.getLogs);

// 获取日志筛选选项 (需要认证)
router.get('/filter-options', authenticate, hasRole(['admin']), logController.getLogFilterOptions);

// 导出日志
router.get('/export', authenticate, hasRole(['admin']), logController.exportLogs);

module.exports = router; 