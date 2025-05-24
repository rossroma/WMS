const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');

const StocktakingOrder = sequelize.define('StocktakingOrder', {
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  productId: {
    type: DataTypes.INTEGER,
    references: {
      model: Product,
      key: 'id'
    }
  },
  actualQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  recordedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  remark: {
    type: DataTypes.STRING
  },
  operator: {
    type: DataTypes.STRING
  }
});

module.exports = StocktakingOrder; 