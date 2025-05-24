const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticate, hasRole } = require('../middleware/auth');

// 所有角色相关路由都需要认证
router.use(authenticate);

// 创建角色（需要管理员权限）
router.post('/', hasRole(['admin']), roleController.createRole);

// 获取所有角色
router.get('/', hasRole(['admin']), roleController.getAllRoles);

// 更新角色
router.put('/:id', hasRole(['admin']), roleController.updateRole);

// 删除角色
router.delete('/:id', hasRole(['admin']), roleController.deleteRole);

// 为用户分配角色
router.post('/assign', hasRole(['admin']), roleController.assignRoleToUser);

module.exports = router; 