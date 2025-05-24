const Inventory = require('../models/Inventory');
const InventoryLog = require('../models/InventoryLog');
const Product = require('../models/Product');
const { Message, MessageType } = require('../models/Message');
const { AppError } = require('../middleware/errorHandler');

// 库存查询
exports.getInventory = async (req, res, next) => {
  try {
    const inventories = await Inventory.findAll({
      include: [{ model: Product }]
    });
    res.status(200).json({
      status: 'success',
      message: '获取库存信息成功',
      data: inventories
    });
  } catch (error) {
    next(new AppError('获取库存信息失败', 500));
  }
};

// 库存流水查询
exports.getInventoryLogs = async (req, res, next) => {
  try {
    const logs = await InventoryLog.findAll({
      include: [{ model: Product }]
    });
    res.status(200).json({
      status: 'success',
      message: '获取库存流水成功',
      data: logs
    });
  } catch (error) {
    next(new AppError('获取库存流水失败', 500));
  }
};

// 库存预警检查
exports.checkInventoryAlerts = async () => {
  try {
    const inventories = await Inventory.findAll({
      include: [{ model: Product }]
    });

    inventories.forEach(async (inventory) => {
      if (inventory.quantity < inventory.Product.stockAlertQuantity) {
        await Message.create({
          content: `库存预警：商品${inventory.Product.name}的库存低于预警阈值。`,
          type: MessageType.INVENTORY_ALERT,
          relatedId: inventory.id
        });
      }
    });
  } catch (error) {
    console.error('Error checking inventory alerts:', error);
  }
}; 