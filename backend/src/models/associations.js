const Product = require('./Product');
const Inventory = require('./Inventory');
const InventoryLog = require('./InventoryLog');
const { InboundOrder } = require('./InboundOrder');
const { OutboundOrder } = require('./OutboundOrder');
const { OrderItem, OrderItemType } = require('./OrderItem');
const { StocktakingOrder } = require('./StocktakingOrder');
const { StocktakingItem } = require('./StocktakingItem');
const Supplier = require('./Supplier');
const Category = require('./Category');
const { PurchaseOrder, PurchaseOrderItem } = require('./PurchaseOrder');

// Product ↔ Inventory: 一对一关系
Product.hasOne(Inventory, { foreignKey: 'productId' });
Inventory.belongsTo(Product, { foreignKey: 'productId' });

// Inventory ↔ InventoryLog: 一对多关系
Inventory.hasMany(InventoryLog, { foreignKey: 'inventoryId' });
InventoryLog.belongsTo(Inventory, { foreignKey: 'inventoryId' });

// Product ↔ InventoryLog: 通过Inventory的间接关系，用于查询
InventoryLog.belongsTo(Product, { 
  foreignKey: 'inventoryId',
  through: Inventory,
  as: 'ProductViaInventory'
});

// 通用订单商品明细关联关系
// Product ↔ OrderItem: 一对多关系
Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

// 入库单多态关联
// InboundOrder ↔ OrderItem: 一对多关系（通过orderType='INBOUND'筛选）
InboundOrder.hasMany(OrderItem, {
  foreignKey: 'orderId',
  scope: { orderType: OrderItemType.INBOUND },
  as: 'items'
});
OrderItem.belongsTo(InboundOrder, {
  foreignKey: 'orderId',
  constraints: false,
  scope: { orderType: OrderItemType.INBOUND }
});

// 出库单多态关联
// OutboundOrder ↔ OrderItem: 一对多关系（通过orderType='OUTBOUND'筛选）
OutboundOrder.hasMany(OrderItem, {
  foreignKey: 'orderId',
  scope: { orderType: OrderItemType.OUTBOUND },
  as: 'items'
});
OrderItem.belongsTo(OutboundOrder, {
  foreignKey: 'orderId',
  constraints: false
});

// 其他现有关联关系
// Product ↔ Supplier: 多对一关系
Product.belongsTo(Supplier, { foreignKey: 'supplierId' });
Supplier.hasMany(Product, { foreignKey: 'supplierId' });

// Product ↔ Category: 多对一关系
Product.belongsTo(Category, { foreignKey: 'categoryId' });
Category.hasMany(Product, { foreignKey: 'categoryId' });

// Category 自关联：支持分类层级
Category.belongsTo(Category, { as: 'ParentCategory', foreignKey: 'parentId' });
Category.hasMany(Category, { as: 'SubCategories', foreignKey: 'parentId' });

// 盘点单与盘点商品的一对多关系
StocktakingOrder.hasMany(StocktakingItem, {
  foreignKey: 'stocktakingOrderId',
  as: 'items'
});

StocktakingItem.belongsTo(StocktakingOrder, {
  foreignKey: 'stocktakingOrderId',
  as: 'stocktakingOrder'
});

// 盘点商品与商品的多对一关系
StocktakingItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});

Product.hasMany(StocktakingItem, {
  foreignKey: 'productId',
  as: 'stocktakingItems'
});

// 采购订单关联关系
// PurchaseOrder ↔ Supplier: 多对一关系
PurchaseOrder.belongsTo(Supplier, {
  foreignKey: 'supplierId',
  as: 'supplier'
});
Supplier.hasMany(PurchaseOrder, {
  foreignKey: 'supplierId'
});

// PurchaseOrder ↔ PurchaseOrderItem: 一对多关系
PurchaseOrder.hasMany(PurchaseOrderItem, {
  foreignKey: 'purchaseOrderId',
  as: 'items'
});
PurchaseOrderItem.belongsTo(PurchaseOrder, {
  foreignKey: 'purchaseOrderId',
  as: 'purchaseOrder'
});

// PurchaseOrderItem ↔ Product: 多对一关系
PurchaseOrderItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});
Product.hasMany(PurchaseOrderItem, {
  foreignKey: 'productId',
  as: 'purchaseOrderItems'
});

module.exports = {
  Product,
  Inventory,
  InventoryLog,
  InboundOrder,
  OutboundOrder,
  OrderItem,
  OrderItemType,
  StocktakingOrder,
  StocktakingItem,
  Supplier,
  Category,
  PurchaseOrder,
  PurchaseOrderItem
}; 