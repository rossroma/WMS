const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StocktakingOrder = sequelize.define('StocktakingOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'order_no',
    comment: '盘点单号'
  },
  stocktakingDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'stocktaking_date',
    comment: '盘点日期'
  },
  operator: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '操作员'
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注'
  },
  totalItems: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'total_items',
    comment: '盘点商品总数'
  }
}, {
  indexes: [
    {
      fields: ['orderNo'],
      unique: true
    },
    {
      fields: ['stocktakingDate']
    }
  ]
});

// StocktakingOrder.sync({ alter: true });

module.exports = { StocktakingOrder }; 