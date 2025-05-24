const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// 库存路由
router.get('/', inventoryController.getInventory);
router.get('/logs', inventoryController.getInventoryLogs);

module.exports = router; 