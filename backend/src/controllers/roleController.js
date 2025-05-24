const Role = require('../models/Role');
const User = require('../models/User');
const UserRole = require('../models/UserRole');
const { AppError } = require('../middleware/errorHandler');
const sequelize = require('../config/database');

// 创建角色
exports.createRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    const role = await Role.create({
      name,
      description,
      permissions
    });

    res.status(201).json(role);
  } catch (error) {
    next(new AppError('创建角色失败', 500));
  }
};

// 获取所有角色
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 更新角色
exports.updateRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await Role.findByPk(req.params.id);

    if (role) {
      await role.update({
        name,
        description,
        permissions
      });
      res.json(role);
    } else {
      return next(new AppError('角色不存在', 404));
    }
  } catch (error) {
    next(new AppError('更新角色失败', 500));
  }
};

// 删除角色
exports.deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (role) {
      await role.destroy();
      res.status(204).send();
    } else {
      return next(new AppError('角色不存在', 404));
    }
  } catch (error) {
    next(new AppError('删除角色失败', 500));
  }
};

// 为用户分配角色
exports.assignRoleToUser = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { userId, roleIds } = req.body;

    // 验证用户是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      await transaction.rollback();
      return next(new AppError('用户不存在', 404));
    }

    // 验证所有角色是否存在
    const roles = await Role.findAll({
      where: { id: roleIds }
    });
    if (roles.length !== roleIds.length) {
      await transaction.rollback();
      return next(new AppError('部分角色不存在', 400));
    }

    // 先删除用户现有的角色
    await UserRole.destroy({
      where: { userId },
      transaction
    });

    // 创建新的角色关联
    const userRoles = roleIds.map(roleId => ({
      UserId: userId,
      RoleId: roleId
    }));

    await UserRole.bulkCreate(userRoles, { transaction });

    await transaction.commit();

    res.status(201).json({
      message: '角色分配成功',
      data: {
        userId,
        roleIds
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('分配角色失败:', error);
    next(new AppError('分配角色失败: ' + error.message, 500));
  }
};

// 获取用户的角色
exports.getUserRoles = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // 验证用户是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    // 获取用户的所有角色
    const userRoles = await UserRole.findAll({
      where: { userId },
      include: [{
        model: Role,
        attributes: ['id', 'name', 'description', 'permissions']
      }]
    });

    res.json({
      data: userRoles.map(ur => ({
        id: ur.Role.id,
        name: ur.Role.name,
        description: ur.Role.description,
        permissions: ur.Role.permissions
      }))
    });
  } catch (error) {
    next(new AppError('获取用户角色失败', 500));
  }
};

// 移除用户的所有角色
exports.removeAllRolesFromUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // 验证用户是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    // 删除用户的所有角色关联
    await UserRole.destroy({
      where: { userId }
    });

    res.status(204).send();
  } catch (error) {
    next(new AppError('移除角色失败', 500));
  }
}; 