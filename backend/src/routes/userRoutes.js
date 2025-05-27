const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const { RESTRICTED_OPERATIONS } = require('../constants/roleConstants');

router.use(authenticate);
router.use(requirePermission(RESTRICTED_OPERATIONS.SYSTEM_ADMIN));

router.get('/', userController.getUserList);

router.post('/', userController.createUser);

router.put('/:id', userController.updateUser);

router.delete('/:id', userController.deleteUser);

router.put('/:id/password', userController.changeUserPassword);

module.exports = router; 