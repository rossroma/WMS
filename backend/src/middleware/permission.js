// 角色等级定义（数字越大权限越高）
const ROLE_LEVELS = {
  'operator': 1,
  'manager': 2,
  'admin': 3
};

/**
 * 检查用户角色是否大于等于指定角色
 * @param {string} userRole - 用户角色
 * @param {string} requiredRole - 所需的最小角色
 * @returns {boolean} 是否有权限
 */
const hasRolePermission = (userRole, requiredRole) => {
  if (!userRole || !requiredRole) {
    return false;
  }
  
  const currentLevel = ROLE_LEVELS[userRole] || 0;
  const requiredLevel = ROLE_LEVELS[requiredRole] || 0;
  
  return currentLevel >= requiredLevel;
};

// 权限检查中间件 - 检查角色等级权限
const requirePermission = (requiredRole) => {
  return (req, res, next) => {
    try {
      // 检查用户是否已认证
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        });
      }

      // 检查用户是否有指定角色权限
      if (!hasRolePermission(req.user.role, requiredRole)) {
        return res.status(403).json({
          success: false,
          message: `权限不足，需要${requiredRole}或更高权限`
        });
      }

      next();
    } catch (error) {
      console.error('权限检查错误:', error);
      res.status(500).json({
        success: false,
        message: '权限检查失败'
      });
    }
  };
};

module.exports = {
  requirePermission
}; 