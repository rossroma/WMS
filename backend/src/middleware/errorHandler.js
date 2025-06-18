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

// 开发环境错误响应
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// 生产环境错误响应
const sendErrorProd = (err, res) => {
  // 可操作的错误：发送详细信息
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } 
  // 编程或其他未知错误：不泄露错误详情
  else {
    logger.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误'
    });
  }
};

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Sequelize 验证错误
    if (err.name === 'SequelizeValidationError') {
      error = new AppError(err.errors[0].message, 400);
    }

    // Sequelize 唯一约束错误
    if (err.name === 'SequelizeUniqueConstraintError') {
      error = new AppError('数据已存在', 400);
    }

    // JWT 错误
    if (err.name === 'JsonWebTokenError') {
      error = new AppError('无效的令牌', 401);
    }
    if (err.name === 'TokenExpiredError') {
      error = new AppError('令牌已过期', 401);
    }

    sendErrorProd(error, res);
  }
};

module.exports = {
  AppError,
  errorHandler
}; 