const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Supplier = require('./Supplier');
const Category = require('./Category');

const Product = sequelize.define('Product', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING
  },
  image: {
    type: DataTypes.STRING
  },
  specification: {
    type: DataTypes.STRING
  },
  code: {
    type: DataTypes.STRING,
    unique: true
  },
  unit: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  stockAlertQuantity: {
    type: DataTypes.INTEGER
  },
  purchasePrice: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  retailPrice: {
    type: DataTypes.FLOAT
  },
  warehouse: {
    type: DataTypes.STRING
  },
  createdBy: {
    type: DataTypes.STRING
  },
  supplierId: {
    type: DataTypes.INTEGER,
    references: {
      model: Supplier,
      key: 'id'
    }
  },
  categoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: Category,
      key: 'id'
    }
  }
});

module.exports = Product; 