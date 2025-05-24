const express = require('express');
const router = express.Router();
const inboundOrderController = require('../controllers/inboundOrderController');

// 入库单路由
router.post('/inbound-orders', inboundOrderController.createInboundOrder);
router.get('/inbound-orders', inboundOrderController.getAllInboundOrders);
router.get('/inbound-orders/:id', inboundOrderController.getInboundOrderById);
router.put('/inbound-orders/:id', inboundOrderController.updateInboundOrder);
router.delete('/inbound-orders/:id', inboundOrderController.deleteInboundOrder);

module.exports = router; 