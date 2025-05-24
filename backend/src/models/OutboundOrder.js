const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');

const OutboundType = {
  STOCK_OUT: 'STOCK_OUT',         // 盘亏出库
  SALE: 'SALE',                   // 销售出库
  TRANSFER_OUT: 'TRANSFER_OUT',    // 调拨出库
  SCRAP: 'SCRAP'                  // 报废出库
};

const OutboundTypeDisplay = {
  [OutboundType.STOCK_OUT]: '盘亏出库',
  [OutboundType.SALE]: '销售出库',
  [OutboundType.TRANSFER_OUT]: '调拨出库',
  [OutboundType.SCRAP]: '报废出库'
};

const OutboundOrder = sequelize.define('OutboundOrder', {
  type: {
    type: DataTypes.ENUM(Object.values(OutboundType)),
    allowNull: false
  },
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING
  },
  remark: {
    type: DataTypes.STRING
  },
  operator: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = { OutboundOrder, OutboundType, OutboundTypeDisplay }; 