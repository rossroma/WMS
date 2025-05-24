const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');

const InventoryLog = sequelize.define('InventoryLog', {
  productId: {
    type: DataTypes.INTEGER,
    references: {
      model: Product,
      key: 'id'
    }
  },
  changeQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  relatedDocument: {
    type: DataTypes.STRING
  },
  operator: {
    type: DataTypes.STRING
  }
});

module.exports = InventoryLog; 