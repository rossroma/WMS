const express = require('express');
const router = express.Router();
const inboundOrderController = require('../controllers/inboundOrderController');

// 入库单路由
router.post('/', inboundOrderController.createInboundOrder);
router.get('/', inboundOrderController.getAllInboundOrders);
router.get('/:id', inboundOrderController.getInboundOrderById);
router.get('/:id/items', inboundOrderController.getInboundOrderItems);
router.put('/:id', inboundOrderController.updateInboundOrder);
router.delete('/:id', inboundOrderController.deleteInboundOrder);

module.exports = router; 