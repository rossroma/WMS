const qiniu = require('qiniu');
const config = require('../config/config');
const { AppError } = require('../middleware/errorHandler');
const logger = require('./loggerService');

class QiniuService {
  constructor() {
    this.mac = new qiniu.auth.digest.Mac(
      config.qiniu.accessKey,
      config.qiniu.secretKey
    );
    this.config = new qiniu.conf.Config();
    this.config.zone = qiniu.zone[config.qiniu.zone];
  }

  // 生成上传凭证
  getUploadToken() {
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: config.qiniu.bucket,
      expires: 7200 // 2小时
    });
    return putPolicy.uploadToken(this.mac);
  }

  // 上传文件
  async uploadFile(file, key) {
    try {
      const uploadToken = this.getUploadToken();
      const formUploader = new qiniu.form_up.FormUploader(this.config);
      const putExtra = new qiniu.form_up.PutExtra();

      return new Promise((resolve, reject) => {
        formUploader.putFile(
          uploadToken,
          key,
          file.path,
          putExtra,
          (err, respBody, respInfo) => {
            if (err) {
              logger.error('七牛云上传失败:', err);
              reject(new AppError('文件上传失败', 500));
              return;
            }

            if (respInfo.statusCode === 200) {
              const url = `${config.qiniu.useHttps ? 'https' : 'http'}://${config.qiniu.domain}/${respBody.key}`;
              resolve({
                url,
                key: respBody.key
              });
            } else {
              logger.error('七牛云上传失败:', respBody);
              reject(new AppError('文件上传失败', 500));
            }
          }
        );
      });
    } catch (error) {
      logger.error('七牛云上传异常:', error);
      throw new AppError('文件上传失败', 500);
    }
  }
}

module.exports = new QiniuService(); 