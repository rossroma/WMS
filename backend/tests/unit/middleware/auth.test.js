const jwt = require('jsonwebtoken');
const { authenticate } = require('../../../src/middleware/auth');

// Mock dependencies
jest.mock('jsonwebtoken');

// Mock User model
jest.mock('../../../src/models/User', () => ({
  findByPk: jest.fn()
}));

const User = require('../../../src/models/User');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('应该成功验证有效的token', async () => {
      // Arrange
      const token = 'valid-token';
      const decodedUser = { id: 1, username: 'testuser' };
      const user = { id: 1, username: 'testuser', status: 'active' };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedUser);
      User.findByPk.mockResolvedValue(user);

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该拒绝没有token的请求', async () => {
      // Arrange
      req.headers.authorization = undefined;

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: '未提供认证令牌' });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝格式错误的authorization header', async () => {
      // Arrange
      req.headers.authorization = 'InvalidFormat';

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: '未提供认证令牌' });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝无效的token', async () => {
      // Arrange
      const token = 'invalid-token';
      req.headers.authorization = `Bearer ${token}`;
      
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: '无效的认证令牌' });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝过期的token', async () => {
      // Arrange
      const token = 'expired-token';
      req.headers.authorization = `Bearer ${token}`;
      
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: '认证令牌已过期' });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝不存在的用户', async () => {
      // Arrange
      const token = 'valid-token';
      const decodedUser = { id: 999, username: 'nonexistent' };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedUser);
      User.findByPk.mockResolvedValue(null);

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: '用户不存在' });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝被禁用的用户', async () => {
      // Arrange
      const token = 'valid-token';
      const decodedUser = { id: 1, username: 'testuser' };
      const user = { id: 1, username: 'testuser', status: 'inactive' };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedUser);
      User.findByPk.mockResolvedValue(user);

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: '账号已被禁用' });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该处理数据库查询错误', async () => {
      // Arrange
      const token = 'valid-token';
      const decodedUser = { id: 1, username: 'testuser' };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedUser);
      User.findByPk.mockRejectedValue(new Error('Database error'));

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
      expect(next).not.toHaveBeenCalled();
    });
  });
}); 