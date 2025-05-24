const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50]
    }
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 3
    }
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'categories',
  timestamps: true,
  hooks: {
    beforeCreate: async (category) => {
      if (category.parentId) {
        const parent = await Category.findByPk(category.parentId);
        if (parent) {
          category.level = parent.level + 1;
        }
      } else {
        category.level = 1;
      }
    },
    beforeUpdate: async (category) => {
      if (category.changed('parentId')) {
        const parent = await Category.findByPk(category.parentId);
        if (parent) {
          category.level = parent.level + 1;
        } else {
          category.level = 1;
        }
      }
    }
  }
});

// 自关联关系
Category.hasMany(Category, { as: 'children', foreignKey: 'parentId' });
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parentId' });

// Category.sync({ alter: true });

module.exports = Category; 