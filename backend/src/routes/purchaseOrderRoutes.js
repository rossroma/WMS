const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/PurchaseOrderController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

// 采购单路由 - 需要认证
router.use(authenticate);

// 所有采购单相关操作都需要manager权限
router.post('/', requirePermission('manager'), purchaseOrderController.createPurchaseOrder);
router.get('/', requirePermission('manager'), purchaseOrderController.getPurchaseOrders);
router.get('/:id/items', requirePermission('manager'), purchaseOrderController.getPurchaseOrderItems);
router.post('/:id/confirm', requirePermission('manager'), purchaseOrderController.confirmPurchaseOrder);
router.delete('/:id', requirePermission('manager'), purchaseOrderController.deletePurchaseOrder);

module.exports = router; 