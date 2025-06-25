const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { createLog } = require('../services/logService');
const { LOG_MODULE, LOG_ACTION_TYPE } = require('../constants/logConstants');
const logger = require('../services/loggerService');

// 获取用户列表
exports.getUserList = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'fullname', 'role', 'status', 'createdAt', 'updatedAt']
    });

    res.json({
      data: users
    });
  } catch (error) {
    logger.error('获取用户列表失败:', error);
    next(new AppError('获取用户列表失败', 500));
  }
};

// 创建用户
exports.createUser = async (req, res, next) => {
  try {
    const { username, password, email, fullname, role = 'operator', status = 'active' } = req.body;

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return next(new AppError('用户名已存在', 400));
    }

    // 创建用户
    const user = await User.create({
      username,
      password,
      email,
      fullname,
      role,
      status
    });

    // 记录创建用户日志
    await createLog({
      userId: req.user ? req.user.id : null,
      username: req.user ? req.user.username : 'System',
      actionType: LOG_ACTION_TYPE.CREATE,
      module: LOG_MODULE.USER,
      ipAddress: req.ip,
      details: `创建用户 ${user.username} (ID: ${user.id}) 成功，角色：${user.role}`
    });

    res.status(201).json({
      message: '用户创建成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    logger.error('创建用户失败:', error);
    next(new AppError('创建用户失败', 500));
  }
};

// 更新用户
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, fullname, role, status } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    // 检查是否为 admin 用户
    if (user.username === 'admin') {
      // 如果尝试禁用 admin 账号或修改角色，返回错误
      if (status && status !== 'active') {
        return next(new AppError('不能修改 admin 账号的状态', 403));
      }
      if (role && role !== 'admin') {
        return next(new AppError('不能修改 admin 账号的角色', 403));
      }
    }

    // 更新用户信息
    await user.update({
      email,
      fullname,
      role,
      status
    });

    // 记录更新用户日志
    await createLog({
      userId: req.user.id,
      username: req.user.username,
      actionType: LOG_ACTION_TYPE.UPDATE,
      module: LOG_MODULE.USER,
      ipAddress: req.ip,
      details: `更新用户 ${user.username} (ID: ${user.id}) 成功`
    });

    res.json({
      message: '用户更新成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    logger.error('更新用户失败:', error);
    next(new AppError('更新用户失败', 500));
  }
};

// 删除用户
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    // 检查是否为 admin 用户
    if (user.username === 'admin') {
      return next(new AppError('不能删除 admin 账号', 403));
    }

    // 删除用户
    await user.destroy();

    // 记录删除用户日志
    await createLog({
      userId: req.user.id,
      username: req.user.username,
      actionType: LOG_ACTION_TYPE.DELETE,
      module: LOG_MODULE.USER,
      ipAddress: req.ip,
      details: `删除用户 ${user.username} (ID: ${id}) 成功`
    });

    res.status(204).send();
  } catch (error) {
    logger.error('删除用户失败:', error);
    next(new AppError('删除用户失败', 500));
  }
};

// 修改用户密码
exports.changeUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    // 更新密码
    await user.update({ password: newPassword });

    // 记录修改密码日志
    await createLog({
      userId: req.user.id,
      username: req.user.username,
      actionType: LOG_ACTION_TYPE.CHANGE_PASSWORD,
      module: LOG_MODULE.USER,
      ipAddress: req.ip,
      details: `用户 ${user.username} (ID: ${user.id}) 的密码已修改`
    });

    res.json({
      message: '密码修改成功'
    });
  } catch (error) {
    logger.error('修改密码失败:', error);
    next(new AppError('修改密码失败', 500));
  }
}; 