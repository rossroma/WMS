const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { requirePermission } = require('../middleware/permission');
const { RESTRICTED_OPERATIONS } = require('../constants/roleConstants');

// 供应商路由 - 只有admin和manager可以访问
router.use(requirePermission(RESTRICTED_OPERATIONS.SUPPLIER_ACCESS));

router.post('/', supplierController.createSupplier);
router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router; 