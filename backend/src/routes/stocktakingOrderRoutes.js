const express = require('express');
const router = express.Router();
const stocktakingOrderController = require('../controllers/stocktakingOrderController');

// 盘点单路由
router.post('/stocktaking-orders', stocktakingOrderController.createStocktakingOrder);
router.get('/stocktaking-orders', stocktakingOrderController.getAllStocktakingOrders);
router.get('/stocktaking-orders/:id', stocktakingOrderController.getStocktakingOrderById);
router.put('/stocktaking-orders/:id', stocktakingOrderController.updateStocktakingOrder);
router.delete('/stocktaking-orders/:id', stocktakingOrderController.deleteStocktakingOrder);

module.exports = router; 