const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class UserRole extends Model {}


UserRole.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'role_id',
    references: {
      model: 'roles',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'UserRole',
  tableName: 'user_roles',
  timestamps: true
});

module.exports = UserRole; 