const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

// 供应商路由 - 需要认证且只有admin和manager可以访问
router.use(authenticate);
router.use(requirePermission('manager')); // 需要manager或更高权限

router.post('/', supplierController.createSupplier);
router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router; 