const express = require('express');
const router = express.Router();
const outboundOrderController = require('../controllers/outboundOrderController');

// 出库单路由
router.post('/', outboundOrderController.createOutboundOrder);
router.get('/', outboundOrderController.getAllOutboundOrders);
router.get('/:id', outboundOrderController.getOutboundOrderById);
router.get('/:id/items', outboundOrderController.getOutboundOrderItems);
router.put('/:id', outboundOrderController.updateOutboundOrder);
router.delete('/:id', outboundOrderController.deleteOutboundOrder);

module.exports = router; 