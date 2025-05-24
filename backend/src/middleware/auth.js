const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 验证 JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: '账号已被禁用' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的认证令牌' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '认证令牌已过期' });
    }
    res.status(500).json({ error: error.message });
  }
};

// 检查用户是否具有指定角色
exports.hasRole = (roles) => {
  return async (req, res, next) => {
    try {
      const userRoles = await req.user.getRoles();
      const hasRequiredRole = userRoles.some(role => roles.includes(role.name));

      if (!hasRequiredRole) {
        return res.status(403).json({ error: '权限不足' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

// 检查用户是否具有指定权限
exports.hasPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      const userRoles = await req.user.getRoles();
      const userPermissions = userRoles.reduce((perms, role) => {
        return [...perms, ...(role.permissions || [])];
      }, []);

      const hasRequiredPermission = permissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasRequiredPermission) {
        return res.status(403).json({ error: '权限不足' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}; 