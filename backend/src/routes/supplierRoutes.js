const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

// 供应商路由
router.post('/suppliers', supplierController.createSupplier);
router.get('/suppliers', supplierController.getAllSuppliers);
router.get('/suppliers/:id', supplierController.getSupplierById);
router.put('/suppliers/:id', supplierController.updateSupplier);
router.delete('/suppliers/:id', supplierController.deleteSupplier);

module.exports = router; 