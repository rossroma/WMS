const { AppError, errorHandler } = require('../../../src/middleware/errorHandler');

// Mock logger服务
jest.mock('../../../src/services/loggerService', () => ({
  error: jest.fn()
}));

const logger = require('../../../src/services/loggerService');

describe('ErrorHandler Middleware', () => {
  let req, res, _next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    _next = jest.fn();
    jest.clearAllMocks();
    
    // 设置默认环境为测试环境
    process.env.NODE_ENV = 'test';
  });

  describe('AppError', () => {
    it('应该创建带有正确属性的错误对象', () => {
      const error = new AppError('Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
    });

    it('应该为5xx错误设置status为error', () => {
      const error = new AppError('Server error', 500);

      expect(error.status).toBe('error');
    });

    it('应该为4xx错误设置status为fail', () => {
      const error = new AppError('Client error', 404);

      expect(error.status).toBe('fail');
    });
  });

  describe('errorHandler', () => {
    describe('开发环境', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
      });

      it('应该返回详细的错误信息', () => {
        const error = new AppError('Test error', 400);
        error.stack = 'Error stack trace';

        errorHandler(error, req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          status: 'fail',
          error: error,
          message: 'Test error',
          stack: 'Error stack trace'
        });
      });

      it('应该设置默认状态码500', () => {
        const error = new Error('Test error');

        errorHandler(error, req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          status: 'error',
          error: error,
          message: 'Test error',
          stack: error.stack
        });
      });
    });

    describe('生产环境', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      it('应该返回操作性错误的详细信息', () => {
        const error = new AppError('User not found', 404);

        errorHandler(error, req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          status: 'fail',
          message: 'User not found'
        });
      });

      it('应该隐藏非操作性错误的详细信息', () => {
        const error = new Error('Database connection failed');
        error.statusCode = 500;

        errorHandler(error, req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          status: 'error',
          message: '服务器内部错误'
        });
        expect(logger.error).toHaveBeenCalledWith('ERROR 💥', expect.any(Object));
      });

      it('应该处理Sequelize验证错误', () => {
        const error = {
          name: 'SequelizeValidationError',
          errors: [{ message: 'Validation failed' }]
        };

        errorHandler(error, req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          status: 'fail',
          message: 'Validation failed'
        });
      });

      it('应该处理Sequelize唯一约束错误', () => {
        const error = {
          name: 'SequelizeUniqueConstraintError'
        };

        errorHandler(error, req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          status: 'fail',
          message: '数据已存在'
        });
      });

      it('应该处理JWT错误', () => {
        const error = {
          name: 'JsonWebTokenError'
        };

        errorHandler(error, req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          status: 'fail',
          message: '无效的令牌'
        });
      });

      it('应该处理JWT过期错误', () => {
        const error = {
          name: 'TokenExpiredError'
        };

        errorHandler(error, req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          status: 'fail',
          message: '令牌已过期'
        });
      });
    });
  });
}); 