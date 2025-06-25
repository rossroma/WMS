const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OutboundType = {
  STOCK_OUT: 'STOCK_OUT',         // 盘亏出库
  SALE: 'SALE'                    // 销售出库
};

const OutboundTypeDisplay = {
  [OutboundType.STOCK_OUT]: '盘亏出库',
  [OutboundType.SALE]: '销售出库'
};

const OutboundOrder = sequelize.define('OutboundOrder', {
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
    comment: '出库单号'
  },
  type: {
    type: DataTypes.ENUM(Object.values(OutboundType)),
    allowNull: false,
    comment: '出库类型'
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
    comment: '出库日期'
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
  },
  relatedOrderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'related_order_id',
    comment: '关联订单ID（盘亏出库关联盘点单ID）'
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

// OutboundOrder.sync({ alter: true });

module.exports = { OutboundOrder, OutboundType, OutboundTypeDisplay }; 