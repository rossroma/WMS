const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Log extends Model {}

Log.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // 系统操作可能没有userId
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true, // 对应userId为空的情况
  },
  actionType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  module: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Log',
  tableName: 'logs',
  timestamps: true, // 自动管理 createdAt 和 updatedAt
});

Log.sync({ alter: true });

module.exports = Log; 