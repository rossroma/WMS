const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// 所有看板相关路由都需要认证
router.use(authenticate);

// 获取综合dashboard数据
router.get('/data', dashboardController.getDashboardData);

// 获取库存预警商品
router.get('/warning-products', dashboardController.getWarningProducts);

// 获取近7天出入库趋势
router.get('/weekly-trend', dashboardController.getWeeklyTrend);

// 获取热门商品
router.get('/hot-products', dashboardController.getHotProducts);

module.exports = router; 