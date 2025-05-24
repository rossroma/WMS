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
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM(Object.values(MessageType)),
    allowNull: false
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = { Message, MessageType, MessageTypeDisplay }; 