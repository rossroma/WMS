const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItemType = {
  INBOUND: 'INBOUND',   // 入库单明细
  OUTBOUND: 'OUTBOUND'  // 出库单明细
};

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderType: {
    type: DataTypes.ENUM(Object.values(OrderItemType)),
    allowNull: false,
    comment: '订单类型：INBOUND-入库单，OUTBOUND-出库单'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '订单ID（入库单ID或出库单ID）'
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '商品ID'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    },
    comment: '数量'
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    comment: '单价'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    comment: '总价'
  },
  unit: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '单位'
  }
}, {
  tableName: 'order_items',
  timestamps: true,
  indexes: [
    {
      fields: ['orderType', 'orderId'],
      name: 'idx_order_items_order'
    },
    {
      fields: ['productId']
    },
    {
      fields: ['orderType']
    }
  ]
});

// OrderItem.sync({ alter: true });

module.exports = { OrderItem, OrderItemType }; 