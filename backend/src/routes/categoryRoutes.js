const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, hasRole } = require('../middleware/auth');

// 获取分类树
router.get('/tree', categoryController.getCategoryTree);

// 获取分类列表（扁平结构）
router.get('/', categoryController.getCategoryList);

// 创建分类
router.post('/', authenticate, hasRole(['admin', 'manager']), categoryController.createCategory);

// 更新分类
router.put('/:id', authenticate, hasRole(['admin', 'manager']), categoryController.updateCategory);

// 删除分类
router.delete('/:id', authenticate, hasRole(['admin', 'manager']), categoryController.deleteCategory);

// 批量更新分类排序
router.post('/batch-sort', authenticate, hasRole(['admin', 'manager']), categoryController.batchUpdateSort);

module.exports = router; 