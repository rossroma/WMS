const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryLog = sequelize.define('InventoryLog', {
  orderItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '订单明细ID，建立与OrderItem的一对一关联'
  },
  changeQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '库存变化数量'
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '操作类型：入库、出库、盘点等'
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '操作日期'
  },
  relatedDocument: {
    type: DataTypes.STRING,
    comment: '相关单据号'
  },
  operator: {
    type: DataTypes.STRING,
    comment: '操作员'
  }
});

// InventoryLog.sync({ alter: true });

module.exports = InventoryLog; 