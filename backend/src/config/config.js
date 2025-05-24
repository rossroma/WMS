require('dotenv').config();

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },

  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wms',
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d'
  },

  // 文件上传配置
  upload: {
    maxSize: process.env.UPLOAD_MAX_SIZE || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    path: process.env.UPLOAD_PATH || 'uploads'
  },

  // 七牛云配置
  qiniu: {
    accessKey: process.env.QINIU_ACCESS_KEY || '',
    secretKey: process.env.QINIU_SECRET_KEY || '',
    bucket: process.env.QINIU_BUCKET || '',
    domain: process.env.QINIU_DOMAIN || '',
    zone: process.env.QINIU_ZONE || 'z0',
    useHttps: process.env.QINIU_USE_HTTPS === 'true',
    useCdn: process.env.QINIU_USE_CDN === 'true'
  },

  // 定时任务配置
  cron: {
    messageCleanup: {
      schedule: process.env.CRON_MESSAGE_CLEANUP || '0 2 * * *',
      retentionDays: process.env.MESSAGE_RETENTION_DAYS || 90
    },
    inventoryCheck: {
      schedule: process.env.CRON_INVENTORY_CHECK || '0 * * * *',
      retryAttempts: process.env.CRON_RETRY_ATTEMPTS || 3
    }
  }
}; 