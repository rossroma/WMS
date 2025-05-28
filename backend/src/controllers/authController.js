const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { createLog } = require('../services/logService');
const { LOG_MODULE, LOG_ACTION_TYPE, LOG_DETAILS } = require('../constants/logConstants');

// 生成 JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      username: user.username,
      role: user.role
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
      where: { username }
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
          fullname: user.fullname,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(new AppError('登录失败', 500));
  }
};

// 登出功能
exports.logout = async (req, res, next) => {
  try {
    const user = req.user;

    // 记录登出日志
    if (user) {
      await createLog({
        userId: user.id,
        username: user.username,
        actionType: LOG_ACTION_TYPE.LOGOUT,
        module: LOG_MODULE.AUTH,
        ipAddress: req.ip,
        details: LOG_DETAILS.LOGOUT_SUCCESS
      });
    }

    res.json({
      status: 'success',
      message: '登出成功',
      data: null
    });
  } catch (error) {
    console.error('登出失败:', error);
    next(new AppError('登出失败', 500));
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    res.json({
      status: 'success',
      message: '获取用户信息成功',
      data: {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(new AppError('获取用户信息失败', 500));
  }
};
