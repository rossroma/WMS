const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');

// 获取上传凭证
router.get('/token', authenticate, uploadController.getUploadToken);

module.exports = router; 