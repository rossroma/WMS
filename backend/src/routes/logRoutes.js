const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

// 日志管理路由 - 需要认证且只有admin可以访问
router.use(authenticate);
router.use(requirePermission('admin')); // 只有admin可以访问

// 获取日志列表
router.get('/', logController.getLogs);

// 获取日志筛选选项
router.get('/filter-options', logController.getLogFilterOptions);

// 导出日志
router.get('/export', logController.exportLogs);

module.exports = router; 