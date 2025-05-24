const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const { AppError } = require('../middleware/errorHandler');

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

    res.json({
      status: 'success',
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          roles: user.Roles.map(role => role.name)
        }
      }
    });
  } catch (error) {
    next(new AppError('登录失败', 500));
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
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles: user.Roles.map(role => role.name)
      }
    });
  } catch (error) {
    next(new AppError('获取用户信息失败', 500));
  }
};
