const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MessageType = {
  INVENTORY_ALERT: 'INVENTORY_ALERT',
  STOCK_IN: 'STOCK_IN',
  STOCK_OUT: 'STOCK_OUT'
};

const MessageTypeDisplay = {
  [MessageType.INVENTORY_ALERT]: '库存预警',
  [MessageType.STOCK_IN]: '盘盈入库',
  [MessageType.STOCK_OUT]: '盘亏出库'
};

const Message = sequelize.define('Message', {
  content: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '消息内容'
  },
  type: {
    type: DataTypes.ENUM(Object.values(MessageType)),
    allowNull: false,
    comment: '消息类型'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read',
    comment: '是否已读'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    comment: '用户ID（消息接收人）'
  },
  relatedId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'related_id',
    comment: '关联业务编号'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'messages',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at',
  indexes: [
    { fields: ['is_read'] },
    { fields: ['type'] },
    { fields: ['created_at'] },
    { fields: ['related_id'] },
    { fields: ['user_id'] }
  ]
});

// Message.sync({ alter: true });

module.exports = { Message, MessageType, MessageTypeDisplay }; 