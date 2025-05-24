const Product = require('./Product');
const Inventory = require('./Inventory');
const InventoryLog = require('./InventoryLog');
const { InboundOrder } = require('./InboundOrder');
const { OutboundOrder } = require('./OutboundOrder');
const StocktakingOrder = require('./StocktakingOrder');
const Supplier = require('./Supplier');
const Category = require('./Category');

// Product ↔ Inventory: 一对一关系
Product.hasOne(Inventory, { foreignKey: 'productId' });
Inventory.belongsTo(Product, { foreignKey: 'productId' });

// Inventory ↔ InventoryLog: 一对多关系  
Inventory.hasMany(InventoryLog, { foreignKey: 'inventoryId' });
InventoryLog.belongsTo(Inventory, { foreignKey: 'inventoryId' });

// Product 与 Supplier, Category 的关联
Product.belongsTo(Supplier, { foreignKey: 'supplierId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

module.exports = {
  Product,
  Inventory,
  InventoryLog,
  InboundOrder,
  OutboundOrder,
  StocktakingOrder,
  Supplier,
  Category
}; 