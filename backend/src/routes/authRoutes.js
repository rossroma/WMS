const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// 用户登录
router.post('/login', authController.login);

// 获取当前用户信息
router.get('/profile', authenticate, authController.getCurrentUser);

module.exports = router; 