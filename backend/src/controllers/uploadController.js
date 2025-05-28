const qiniuService = require('../services/qiniuService');
const logger = require('../services/loggerService');
const { generateRandomString } = require('../utils/helpers');

// 获取上传凭证
exports.getUploadToken = (req, res) => {
  try {
    const token = qiniuService.getUploadToken();
    const config = qiniuService.getUploadConfig();
    
    res.json({
      status: 'success',
      message: '获取上传凭证成功',
      data: {
        token,
        domain: config.domain,
        useHttps: config.useHttps,
        // 生成唯一的文件key前缀
        keyPrefix: `uploads/${Date.now()}-${generateRandomString(8)}`
      }
    });
  } catch (error) {
    logger.error('获取上传凭证失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取上传凭证失败',
      data: null
    });
  }
}; 