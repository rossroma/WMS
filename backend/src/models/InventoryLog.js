const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Inventory = require('./Inventory');

const InventoryLog = sequelize.define('InventoryLog', {
  inventoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: Inventory,
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

// InventoryLog.sync({ alter: true });

module.exports = InventoryLog; 