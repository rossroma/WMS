const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');
require('winston-daily-rotate-file');

// 创建日志目录
const logDir = path.dirname(config.logging.file);
try {
  fs.mkdirSync(logDir, { recursive: true });
} catch (error) {
  console.error('创建日志目录失败:', error);
  process.exit(1);
}

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 创建日志记录器
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// 添加文件输出
if (config.server.env !== 'development') {
  // 普通日志
  logger.add(new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: config.logging.maxSize,
    maxFiles: config.logging.maxFiles,
    zippedArchive: true
  }));
}

// 错误日志始终记录到文件
logger.add(new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: config.logging.maxSize,
  maxFiles: config.logging.maxFiles,
  level: 'error',
  zippedArchive: true
}));

// 记录未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  // 给进程一些时间来处理日志
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason);
});

// 优雅关闭
const shutdown = () => {
  logger.info('正在关闭日志服务...');
  logger.end(() => {
    logger.info('日志服务已关闭');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = logger; 