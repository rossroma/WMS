const Inventory = require('../models/Inventory');
const InventoryLog = require('../models/InventoryLog');
const Product = require('../models/Product');
const MessageService = require('../services/messageService');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// 库存查询
exports.getInventory = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      productName
    } = req.query;

    // 计算分页参数
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    // 构建查询配置
    const queryConfig = {
      include: [{
        model: Product,
        required: true // 使用 INNER JOIN 确保有关联的 Product
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    };

    // 如果有商品名称搜索条件，添加到 include 的 where 中
    if (productName) {
      queryConfig.include[0].where = {
        name: { [Op.like]: `%${productName}%` }
      };
    }

    // 查询库存列表和总数
    const { count, rows } = await Inventory.findAndCountAll(queryConfig);

    // 返回分页数据
    res.status(200).json({
      status: 'success',
      message: '获取库存信息成功',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取库存信息失败:', error);
    next(new AppError('获取库存信息失败', 500));
  }
};

// 库存流水查询
exports.getInventoryLogs = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      productName,
      type,
      operator,
      startDate,
      endDate
    } = req.query;

    // 构建库存流水查询条件
    const where = {};
    
    if (type) {
      where.type = type;
    }
    
    if (operator) {
      where.operator = { [Op.like]: `%${operator}%` };
    }
    
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      where.date = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      where.date = {
        [Op.lte]: new Date(endDate)
      };
    }

    // 计算分页参数
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    // 构建查询配置 - InventoryLog 通过 Inventory 关联到 Product
    const queryConfig = {
      where,
      include: [{
        model: Inventory,
        required: true,
        include: [{
          model: Product,
          required: true
        }]
      }],
      limit,
      offset,
      order: [['date', 'DESC']]
    };

    // 如果有商品名称搜索条件，添加到嵌套的 Product include 中
    if (productName) {
      queryConfig.include[0].include[0].where = {
        name: { [Op.like]: `%${productName}%` }
      };
    }

    // 查询库存流水列表和总数
    const { count, rows } = await InventoryLog.findAndCountAll(queryConfig);

    // 返回分页数据
    res.status(200).json({
      status: 'success',
      message: '获取库存流水成功',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取库存流水失败:', error);
    next(new AppError('获取库存流水失败', 500));
  }
};

// 库存预警检查
exports.checkInventoryAlerts = async (pusher = 'system') => {
  try {
    const inventories = await Inventory.findAll({
      include: [{ 
        model: Product,
        where: {
          stockAlertQuantity: {
            [Op.gt]: 0
          }
        }
      }]
    });

    for (const inventory of inventories) {
      if (inventory.quantity < inventory.Product.stockAlertQuantity) {
        await MessageService.createInventoryAlert(inventory, inventory.Product, pusher);
      }
    }
  } catch (error) {
    console.error('Error checking inventory alerts:', error);
  }
}; 