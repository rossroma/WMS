const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parentCategoryId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

module.exports = Category; 