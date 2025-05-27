const { hasPermission } = require('../constants/roleConstants');

// 权限检查中间件 - 只对特定受限操作进行检查
const requirePermission = (operation) => {
  return (req, res, next) => {
    try {
      // 检查用户是否已认证
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        });
      }

      // 检查用户是否有指定操作权限
      if (!hasPermission(req.user.role, operation)) {
        return res.status(403).json({
          success: false,
          message: '权限不足'
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