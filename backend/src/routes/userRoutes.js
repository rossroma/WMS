const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

// 用户管理路由 - 需要认证且只有admin可以访问
router.use(authenticate);

router.get('/', userController.getUserList);

router.post('/', requirePermission('admin'), userController.createUser);

router.put('/:id', requirePermission('admin'), userController.updateUser);

router.delete('/:id', requirePermission('admin'), userController.deleteUser);

router.put('/:id/password', userController.changeUserPassword);

module.exports = router; 