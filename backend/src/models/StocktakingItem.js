const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StocktakingItem = sequelize.define('StocktakingItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  stocktakingOrderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'stocktaking_order_id',
    comment: '盘点单ID',
    references: {
      model: 'stocktaking_orders',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product_id',
    comment: '商品ID',
    references: {
      model: 'products',
      key: 'id'
    }
  },
  productName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'product_name',
    comment: '商品名称'
  },
  productCode: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'product_code',
    comment: '商品编码'
  },
  specification: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '规格'
  },
  unit: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '单位'
  },
  systemQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'system_quantity',
    comment: '系统库存数量'
  },
  actualQuantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'actual_quantity',
    comment: '实际盘点数量'
  }
}, {
  tableName: 'stocktaking_items',
  timestamps: true,
  indexes: [
    {
      fields: ['stocktakingOrderId']
    },
    {
      fields: ['productId']
    },
    {
      fields: ['stocktakingOrderId', 'productId'],
      unique: true // 同一盘点单中不能重复添加同一商品
    }
  ]
});

// StocktakingItem.sync({ alter: true });

module.exports = { StocktakingItem }; 