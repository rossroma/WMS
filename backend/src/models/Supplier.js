const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactPerson: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING
  },
  creditRating: {
    type: DataTypes.INTEGER
  },
  paymentMethod: {
    type: DataTypes.STRING
  },
  manager: {
    type: DataTypes.STRING
  }
});

module.exports = Supplier; 