const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config/config');
const qiniuService = require('../services/qiniuService');
const { AppError } = require('../middleware/errorHandler');
const { generateRandomString } = require('../utils/helpers');

// 配置multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), config.upload.path);
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${generateRandomString(8)}${ext}`;
    cb(null, filename);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('不支持的文件类型', 400), false);
  }
};

// 创建multer实例
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize
  }
});

// 上传文件
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('请选择要上传的文件', 400);
    }

    // 生成文件key
    const ext = path.extname(req.file.originalname);
    const key = `uploads/${Date.now()}-${generateRandomString(8)}${ext}`;

    // 上传到七牛云
    const result = await qiniuService.uploadFile(req.file, key);

    // 删除本地临时文件
    await fs.unlink(req.file.path);

    res.json({
      status: 'success',
      message: '文件上传成功',
      data: result
    });
  } catch (error) {
    // 确保清理临时文件
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('清理临时文件失败:', err);
      }
    }
    next(error);
  }
};

// 获取上传凭证
exports.getUploadToken = (req, res) => {
  const token = qiniuService.getUploadToken();
  res.json({
    status: 'success',
    message: '获取上传凭证成功',
    data: { token }
  });
};

// 导出multer中间件
exports.upload = upload; 