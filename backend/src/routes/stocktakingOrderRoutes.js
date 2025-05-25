const express = require('express');
const router = express.Router();
const stocktakingOrderController = require('../controllers/stocktakingOrderController');

// 盘点单路由
router.get('/', stocktakingOrderController.getStocktakingOrders);
router.post('/', stocktakingOrderController.createStocktakingOrder);
router.get('/:id', stocktakingOrderController.getStocktakingOrderById);
router.delete('/:id', stocktakingOrderController.deleteStocktakingOrder);

// 盘点商品明细路由
router.get('/:id/items', stocktakingOrderController.getStocktakingItems);
router.put('/items/:itemId', stocktakingOrderController.updateStocktakingItem);

module.exports = router;