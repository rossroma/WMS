const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const { AppError } = require('../middleware/errorHandler');
const { createLog } = require('../services/logService');
const { LOG_MODULE, LOG_ACTION_TYPE, LOG_DETAILS } = require('../constants/logConstants');

// 生成 JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      username: user.username,
      roles: user.Roles.map(role => role.name)
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// 用户登录
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({
      where: { username },
      include: [{
        model: Role,
        through: UserRole
      }]
    });

    if (!user) {
      return next(new AppError('用户名或密码错误', 401));
    }

    // 验证密码
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return next(new AppError('用户名或密码错误', 401));
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return next(new AppError('账号已被禁用', 403));
    }

    // 更新最后登录时间
    await user.update({ lastLoginAt: new Date() });

    // 生成 token
    const token = generateToken(user);

    // 记录登录日志
    await createLog({
      userId: user.id,
      username: user.username,
      actionType: LOG_ACTION_TYPE.LOGIN,
      module: LOG_MODULE.AUTH,
      ipAddress: req.ip,
      details: LOG_DETAILS.LOGIN_SUCCESS
    });

    res.json({
      status: 'success',
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          fullname: user.name,
          email: user.email,
          roles: user.Roles.map(role => role.name)
        }
      }
    });
  } catch (error) {
    next(new AppError('登录失败', 500));
  }
};

// 登出功能 (如果需要)
exports.logout = async (req, res, next) => {
  try {
    // 假设前端会清除token，后端主要是记录日志
    // 如果有服务端session或token黑名单机制，可以在此处理
    if (req.user) {
      await createLog({
        userId: req.user.id,
        username: req.user.username,
        actionType: LOG_ACTION_TYPE.LOGOUT,
        module: LOG_MODULE.AUTH,
        ipAddress: req.ip,
        details: '用户登出成功'
      });
    }
    res.json({
      status: 'success',
      message: '登出成功'
    });
  } catch (error) {
    next(new AppError('登出失败', 500));
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Role,
        through: UserRole
      }]
    });

    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    res.json({
      status: 'success',
      message: '获取用户信息成功',
      data: {
        id: user.id,
        username: user.username,
        fullname: user.name,
        email: user.email,
        phone: user.phone,
        roles: user.Roles.map(role => role.name)
      }
    });
  } catch (error) {
    next(new AppError('获取用户信息失败', 500));
  }
};
