const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const { AppError } = require('../middleware/errorHandler');
const { createLog } = require('../services/logService');
const { LOG_MODULE, LOG_ACTION_TYPE } = require('../constants/logConstants');

// 获取用户列表
exports.getUserList = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'fullname', 'status', 'createdAt', 'updatedAt'],
      include: [{
        model: Role,
        through: UserRole,
        attributes: ['id', 'name', 'description']
      }]
    });

    res.json({
      data: users.map(user => ({
        ...user.toJSON(),
        roles: user.Roles
      }))
    });
  } catch (error) {
    next(new AppError('获取用户列表失败', 500));
  }
};

// 创建用户
exports.createUser = async (req, res, next) => {
  try {
    const { username, password, email, fullname, status = 'active' } = req.body;

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
      phone,
      fullname,
      status
    });

    // 分配默认角色
    try {
      const defaultRole = await Role.findOne({ where: { name: 'operator' } });
      if (defaultRole) {
        await user.setRoles([defaultRole]);
      }
    } catch (error) {
      console.error('分配默认角色失败:', error);
      // 不抛出错误，因为用户创建已经成功，角色分配失败不应该影响用户创建
    }

    // 记录创建用户日志
    await createLog({
      userId: req.user ? req.user.id : null,
      username: req.user ? req.user.username : 'System',
      actionType: LOG_ACTION_TYPE.CREATE,
      module: LOG_MODULE.USER,
      ipAddress: req.ip,
      details: `创建用户 ${user.username} (ID: ${user.id}) 成功`
    });

    res.status(201).json({
      message: '用户创建成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        fullname: user.fullname,
        status: user.status
      }
    });
  } catch (error) {
    next(new AppError('创建用户失败', 500));
  }
};

// 更新用户
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, fullname, status, phone } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    // 检查是否为 admin 用户
    if (user.username === 'admin') {
      // 如果尝试禁用 admin 账号，返回错误
      if (status && status !== 'active') {
        return next(new AppError('不能修改 admin 账号的状态', 403));
      }
    }

    // 更新用户信息
    await user.update({
      email,
      fullname,
      phone,
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
        phone: user.phone,
        fullname: user.fullname,
        status: user.status
      }
    });
  } catch (error) {
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

    // 删除用户角色关联
    await UserRole.destroy({ where: { userId: id } });
    
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
    next(new AppError('修改密码失败', 500));
  }
}; 