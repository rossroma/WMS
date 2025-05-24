const express = require('express');
const router = express.Router();
const outboundOrderController = require('../controllers/outboundOrderController');

// 出库单路由
router.post('/outbound-orders', outboundOrderController.createOutboundOrder);
router.get('/outbound-orders', outboundOrderController.getAllOutboundOrders);
router.get('/outbound-orders/:id', outboundOrderController.getOutboundOrderById);
router.put('/outbound-orders/:id', outboundOrderController.updateOutboundOrder);
router.delete('/outbound-orders/:id', outboundOrderController.deleteOutboundOrder);

module.exports = router; 