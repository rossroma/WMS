const logger = require('../services/loggerService');

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 处理特定类型的错误
const handleSpecificErrors = (err) => {
  // 处理Sequelize验证错误
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors[0].message;
    return new AppError(message, 400);
  }

  // 处理Sequelize唯一约束错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    return new AppError('数据已存在', 400);
  }

  // 处理JWT错误
  if (err.name === 'JsonWebTokenError') {
    return new AppError('无效的令牌', 401);
  }

  // 处理JWT过期错误
  if (err.name === 'TokenExpiredError') {
    return new AppError('令牌已过期', 401);
  }

  // 返回原错误
  return err;
};

// 全局错误处理中间件
const errorHandler = (err, req, res, _next) => {
  const error = handleSpecificErrors(err);
  
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // 开发环境：返回详细错误信息
    res.status(error.statusCode).json({
      status: error.status,
      error: error,
      message: error.message,
      stack: error.stack
    });
  } else {
    // 生产环境：只返回安全的错误信息
    if (error.isOperational) {
      res.status(error.statusCode).json({
        status: error.status,
        message: error.message
      });
    } else {
      // 程序错误，不泄露错误详情
      logger.error('ERROR 💥', error);
      res.status(500).json({
        status: 'error',
        message: '服务器内部错误'
      });
    }
  }
};

module.exports = {
  AppError,
  errorHandler
}; 