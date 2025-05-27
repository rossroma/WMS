const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

router.use(authenticate);
router.use(requirePermission('manager'));

// 获取分类树
router.get('/tree', categoryController.getCategoryTree);

// 获取分类列表（扁平结构）
router.get('/', categoryController.getCategoryList);

// 创建分类
router.post('/', categoryController.createCategory);

// 更新分类
router.put('/:id', categoryController.updateCategory);

// 删除分类
router.delete('/:id', categoryController.deleteCategory);

// 批量更新分类排序
router.post('/batch-sort', categoryController.batchUpdateSort);

module.exports = router; 