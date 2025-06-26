const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

// 商品路由 - 需要认证
router.use(authenticate);

// 商品增删改需要manager权限，查询所有用户都可以
router.post('/', requirePermission('manager'), productController.createProduct);
router.get('/', productController.getAllProducts); // 所有用户都可以查询
router.get('/select/list', productController.getProductsForSelect); // 商品选择接口，所有用户都可以查询
router.get('/:id', productController.getProductById); // 所有用户都可以查询
router.put('/:id', requirePermission('manager'), productController.updateProduct);
router.delete('/:id', requirePermission('manager'), productController.deleteProduct);

module.exports = router; 