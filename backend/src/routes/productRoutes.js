const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { requirePermission } = require('../middleware/permission');
const { RESTRICTED_OPERATIONS } = require('../constants/roleConstants');

// 商品路由
router.post('/', requirePermission(RESTRICTED_OPERATIONS.PRODUCT_WRITE), productController.createProduct);
router.get('/', productController.getAllProducts); // 所有用户都可以查询
router.get('/:id', productController.getProductById); // 所有用户都可以查询
router.put('/:id', requirePermission(RESTRICTED_OPERATIONS.PRODUCT_WRITE), productController.updateProduct);
router.delete('/:id', requirePermission(RESTRICTED_OPERATIONS.PRODUCT_WRITE), productController.deleteProduct);

module.exports = router; 