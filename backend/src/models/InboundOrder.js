const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');

const InboundType = {
  STOCK_IN: 'STOCK_IN',           // 盘盈入库
  PURCHASE: 'PURCHASE',           // 采购入库
  RETURN: 'RETURN',              // 退货入库
  TRANSFER_IN: 'TRANSFER_IN'      // 调拨入库
};

const InboundTypeDisplay = {
  [InboundType.STOCK_IN]: '盘盈入库',
  [InboundType.PURCHASE]: '采购入库',
  [InboundType.RETURN]: '退货入库',
  [InboundType.TRANSFER_IN]: '调拨入库'
};

const InboundOrder = sequelize.define('InboundOrder', {
  type: {
    type: DataTypes.ENUM(Object.values(InboundType)),
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

module.exports = { InboundOrder, InboundType, InboundTypeDisplay }; 