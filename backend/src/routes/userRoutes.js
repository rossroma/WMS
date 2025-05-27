const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

// 用户管理路由 - 需要认证且只有admin可以访问
router.use(authenticate);
router.use(requirePermission('admin')); // 只有admin可以访问

router.get('/', userController.getUserList);

router.post('/', userController.createUser);

router.put('/:id', userController.updateUser);

router.delete('/:id', userController.deleteUser);

router.put('/:id/password', userController.changeUserPassword);

module.exports = router; 