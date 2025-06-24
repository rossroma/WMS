const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');
const Supplier = require('./Supplier');

const PurchaseOrderStatus = {
    PENDING: 'PENDING',       // 未确认
    CONFIRMED: 'CONFIRMED'    // 已确认
};

const PurchaseOrderStatusDisplay = {
    [PurchaseOrderStatus.PENDING]: '未确认',
    [PurchaseOrderStatus.CONFIRMED]: '已确认'
};

const PurchaseOrder = sequelize.define('PurchaseOrder', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderNo: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'order_no'
    },
    supplierId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'supplier_id',
        references: {
            model: Supplier,
            key: 'id'
        }
    },
    orderDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'order_date'
    },
    expectedArrivalDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'expected_arrival_date'
    },
    status: {
        type: DataTypes.ENUM(Object.values(PurchaseOrderStatus)),
        allowNull: false,
        defaultValue: PurchaseOrderStatus.PENDING
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        field: 'total_amount'
    },
    totalQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'total_quantity'
    },
    paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'payment_method'
    },
    operator: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    remark: {
        type: DataTypes.STRING(500),
        allowNull: true
    }
}, {
    tableName: 'purchase_orders',
    underscored: true,
    indexes: [
        {
            fields: ['orderNo'],
            unique: true
        },
        {
            fields: ['supplierId']
        },
        {
            fields: ['status']
        },
        {
            fields: ['orderDate']
        }
    ]
});

const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    purchaseOrderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'purchase_order_id',
        references: {
            model: PurchaseOrder,
            key: 'id'
        }
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'product_id',
        references: {
            model: Product,
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        field: 'unit_price'
    },
    totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        field: 'total_price'
    }
}, {
    tableName: 'purchase_order_items',
    underscored: true,
    indexes: [
        {
            fields: ['purchaseOrderId']
        },
        {
            fields: ['productId']
        },
        {
            fields: ['purchaseOrderId', 'productId'],
            unique: true
        }
    ]
});

module.exports = {
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderStatus,
    PurchaseOrderStatusDisplay
}; 