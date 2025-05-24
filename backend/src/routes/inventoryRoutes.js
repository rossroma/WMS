const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// 库存路由
router.get('/inventory', inventoryController.getInventory);
router.get('/inventory/logs', inventoryController.getInventoryLogs);

module.exports = router; 