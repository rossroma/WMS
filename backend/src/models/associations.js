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
Product.hasOne(Inventory, { 
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Inventory.belongsTo(Product, { 
  foreignKey: 'productId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// InventoryLog ↔ OrderItem: 一对一关系（库存流水直接关联订单明细）
InventoryLog.belongsTo(OrderItem, {
  foreignKey: 'orderItemId',
  as: 'orderItem',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
OrderItem.hasOne(InventoryLog, {
  foreignKey: 'orderItemId',
  as: 'inventoryLog',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// 通用订单商品明细关联关系
// Product ↔ OrderItem: 一对多关系
Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

// 入库单多态关联
// InboundOrder ↔ OrderItem: 一对多关系（通过orderType='INBOUND'筛选，级联删除）
InboundOrder.hasMany(OrderItem, {
  foreignKey: 'orderId',
  scope: { orderType: OrderItemType.INBOUND },
  as: 'items',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
OrderItem.belongsTo(InboundOrder, {
  foreignKey: 'orderId',
  constraints: false,
  scope: { orderType: OrderItemType.INBOUND },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// 出库单多态关联
// OutboundOrder ↔ OrderItem: 一对多关系（通过orderType='OUTBOUND'筛选，级联删除）
OutboundOrder.hasMany(OrderItem, {
  foreignKey: 'orderId',
  scope: { orderType: OrderItemType.OUTBOUND },
  as: 'items',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
OrderItem.belongsTo(OutboundOrder, {
  foreignKey: 'orderId',
  constraints: false,
  scope: { orderType: OrderItemType.OUTBOUND },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
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

// 盘点单与盘点商品的一对多关系（级联删除）
StocktakingOrder.hasMany(StocktakingItem, {
  foreignKey: 'stocktakingOrderId',
  as: 'items',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

StocktakingItem.belongsTo(StocktakingOrder, {
  foreignKey: 'stocktakingOrderId',
  as: 'stocktakingOrder',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
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

// PurchaseOrder ↔ PurchaseOrderItem: 一对多关系（级联删除）
PurchaseOrder.hasMany(PurchaseOrderItem, {
  foreignKey: 'purchaseOrderId',
  as: 'items',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
PurchaseOrderItem.belongsTo(PurchaseOrder, {
  foreignKey: 'purchaseOrderId',
  as: 'purchaseOrder',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
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

// 入库单关联订单关系（可选关联）
// 入库单 ↔ 采购单: 多对一关系（采购入库时）
InboundOrder.belongsTo(PurchaseOrder, {
  foreignKey: 'relatedOrderId',
  constraints: false, // 不强制约束，因为可能关联不同类型的订单
  as: 'relatedPurchaseOrder'
});
PurchaseOrder.hasMany(InboundOrder, {
  foreignKey: 'relatedOrderId',
  constraints: false,
  as: 'relatedInboundOrders'
});

// 入库单 ↔ 盘点单: 多对一关系（盘盈入库时）
InboundOrder.belongsTo(StocktakingOrder, {
  foreignKey: 'relatedOrderId',
  constraints: false, // 不强制约束，因为可能关联不同类型的订单
  as: 'relatedStocktakingOrder'
});
StocktakingOrder.hasMany(InboundOrder, {
  foreignKey: 'relatedOrderId',
  constraints: false,
  as: 'relatedInboundOrders'
});

// 出库单关联订单关系（可选关联）
// 出库单 ↔ 盘点单: 多对一关系（盘亏出库时）
OutboundOrder.belongsTo(StocktakingOrder, {
  foreignKey: 'relatedOrderId',
  constraints: false, // 不强制约束，因为可能关联不同类型的订单
  as: 'relatedStocktakingOrder'
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