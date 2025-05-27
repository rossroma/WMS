const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const { RESTRICTED_OPERATIONS } = require('../constants/roleConstants');

// 日志管理路由 - 只有admin可以访问
router.use(authenticate);
router.use(requirePermission(RESTRICTED_OPERATIONS.SYSTEM_ADMIN));

// 获取日志列表 (需要认证和系统权限)
router.get('/', logController.getLogs);

// 获取日志筛选选项 (需要认证)
router.get('/filter-options', logController.getLogFilterOptions);

// 导出日志
router.get('/export', logController.exportLogs);

module.exports = router; 