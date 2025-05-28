const qiniu = require('qiniu');
const config = require('../config/config');

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

  // 获取上传配置信息
  getUploadConfig() {
    return {
      domain: config.qiniu.domain,
      useHttps: config.qiniu.useHttps,
      bucket: config.qiniu.bucket
    };
  }
}

module.exports = new QiniuService(); 