const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

router.use(authenticate);

// 供应商路由 - 增删改需要高级权限
router.post('/', requirePermission('manager'), supplierController.createSupplier);
router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.put('/:id', requirePermission('manager'), supplierController.updateSupplier);
router.delete('/:id', requirePermission('manager'), supplierController.deleteSupplier);

module.exports = router; 