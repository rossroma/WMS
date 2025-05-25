const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// 所有看板相关路由都需要认证
router.use(authenticate);

// 获取综合dashboard数据
router.get('/data', dashboardController.getDashboardData);

// 获取今日入库数量
router.get('/today-inbound', dashboardController.getTodayInboundCount);

// 获取今日出库数量
router.get('/today-outbound', dashboardController.getTodayOutboundCount);

// 获取库存预警商品
router.get('/warning-products', dashboardController.getWarningProducts);

// 获取近7天出入库趋势
router.get('/weekly-trend', dashboardController.getWeeklyTrend);

// 获取热门商品
router.get('/hot-products', dashboardController.getHotProducts);

// 获取库存概览数据
router.get('/inventory-overview', dashboardController.getInventoryOverview);

// 获取出入库统计
router.get('/in-out-statistics', dashboardController.getInOutStatistics);

// 获取盘点统计
router.get('/stocktaking-statistics', dashboardController.getStocktakingStatistics);

// 获取消息统计
router.get('/message-statistics', dashboardController.getMessageStatistics);

// 获取库存趋势数据
router.get('/inventory-trend', dashboardController.getInventoryTrend);

// 获取热门商品排行
router.get('/top-products', dashboardController.getTopProducts);

module.exports = router; 