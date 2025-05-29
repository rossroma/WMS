const { requirePermission } = require('../../../src/middleware/permission');

describe('Permission Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('requirePermission', () => {
    it('应该允许admin访问所有资源', () => {
      req.user = { role: 'admin' };
      const middleware = requirePermission('operator');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该允许manager访问operator级别的资源', () => {
      req.user = { role: 'manager' };
      const middleware = requirePermission('operator');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该允许相同角色访问资源', () => {
      req.user = { role: 'operator' };
      const middleware = requirePermission('operator');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该拒绝operator访问manager级别的资源', () => {
      req.user = { role: 'operator' };
      const middleware = requirePermission('manager');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '权限不足，需要manager或更高权限'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝operator访问admin级别的资源', () => {
      req.user = { role: 'operator' };
      const middleware = requirePermission('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '权限不足，需要admin或更高权限'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝manager访问admin级别的资源', () => {
      req.user = { role: 'manager' };
      const middleware = requirePermission('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '权限不足，需要admin或更高权限'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝未认证的用户', () => {
      req.user = null;
      const middleware = requirePermission('operator');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '用户未认证'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝没有角色的用户', () => {
      req.user = { id: 1 }; // 没有role字段
      const middleware = requirePermission('operator');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '权限不足，需要operator或更高权限'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝未知角色的用户', () => {
      req.user = { role: 'unknown' };
      const middleware = requirePermission('operator');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '权限不足，需要operator或更高权限'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该处理权限检查过程中的错误', () => {
      req.user = { role: 'admin' };
      const middleware = requirePermission('operator');
      
      // 模拟next函数抛出错误
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // 重写req.user的getter来抛出错误
      Object.defineProperty(req, 'user', {
        get: () => {
          throw new Error('Test error');
        }
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '权限检查失败'
      });
      expect(consoleSpy).toHaveBeenCalledWith('权限检查错误:', expect.any(Error));
      expect(next).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
}); 