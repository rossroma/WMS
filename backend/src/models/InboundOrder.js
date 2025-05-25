const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InboundType = {
  STOCK_IN: 'STOCK_IN',           // 盘盈入库
  PURCHASE: 'PURCHASE',           // 采购入库
  RETURN: 'RETURN',              // 退货入库
  TRANSFER_IN: 'TRANSFER_IN'      // 调拨入库
};

const InboundTypeDisplay = {
  [InboundType.STOCK_IN]: '盘盈入库',
  [InboundType.PURCHASE]: '采购入库',
  [InboundType.RETURN]: '退货入库'
};

const InboundOrder = sequelize.define('InboundOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'order_no',
    comment: '入库单号'
  },
  type: {
    type: DataTypes.ENUM(Object.values(InboundType)),
    allowNull: false,
    comment: '入库类型'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    field: 'total_amount',
    comment: '总金额'
  },
  totalQuantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'total_quantity',
    comment: '总数量'
  },
  orderDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'order_date',
    comment: '入库日期'
  },
  operator: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '操作员'
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注'
  }
}, {
  indexes: [
    {
      fields: ['orderNo'],
      unique: true
    },
    {
      fields: ['type']
    },
    {
      fields: ['orderDate']
    }
  ]
});

// InboundOrder.sync({ alter: true });

module.exports = { InboundOrder, InboundType, InboundTypeDisplay }; 