const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// 所有看板相关路由都需要认证
router.use(authenticate);

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