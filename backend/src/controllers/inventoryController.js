const Inventory = require('../models/Inventory');
const InventoryLog = require('../models/InventoryLog');
const { OrderItem } = require('../models/OrderItem');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const logger = require('../services/loggerService');

// 库存查询
exports.getInventory = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      productName,
      stockStatus,
      supplierId
    } = req.query;

    // 计算分页参数
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    // 构建Product的查询条件
    const productWhere = {};
    
    // 如果有商品名称搜索条件
    if (productName) {
      productWhere.name = { [Op.like]: `%${productName}%` };
    }
    
    // 如果有供应商筛选条件
    if (supplierId) {
      productWhere.supplierId = supplierId;
    }

    // 构建查询配置
    const queryConfig = {
      include: [{
        model: Product,
        required: true, // 使用 INNER JOIN 确保有关联的 Product
        where: Object.keys(productWhere).length > 0 ? productWhere : undefined
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    };

    // 如果有库存状态筛选，添加相应的查询条件
    if (stockStatus) {
      // 由于库存状态需要根据quantity和stockAlertQuantity的关系来判断
      // 这里先查询所有数据，然后在JavaScript中进行筛选
      // 为了性能考虑，我们先获取较大的数据集
      queryConfig.limit = 10000; // 临时设置大的限制
      queryConfig.offset = 0;
    }

    // 查询库存列表和总数
    const { count, rows } = await Inventory.findAndCountAll(queryConfig);

    let filteredRows = rows;
    let filteredCount = count;

    // 如果有库存状态筛选，进行筛选
    if (stockStatus) {
      filteredRows = rows.filter(row => {
        const quantity = row.quantity || 0;
        const alertQuantity = row.Product?.stockAlertQuantity || 0;
        
        switch (stockStatus) {
          case 'normal':
            // 库存正常：有库存且不在预警范围内
            return quantity > 0 && (alertQuantity <= 0 || quantity > alertQuantity);
          case 'warning':
            // 库存预警：有库存但在预警范围内
            return quantity > 0 && alertQuantity > 0 && quantity <= alertQuantity;
          case 'out_of_stock':
            // 无库存：库存为0
            return quantity <= 0;
          default:
            return true;
        }
      });

      filteredCount = filteredRows.length;

      // 应用分页
      const start = (parseInt(page) - 1) * limit;
      const end = start + limit;
      filteredRows = filteredRows.slice(start, end);
    }

    // 返回分页数据
    res.status(200).json({
      status: 'success',
      message: '获取库存信息成功',
      data: {
        list: filteredRows,
        total: filteredCount,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(filteredCount / limit)
      }
    });
  } catch (error) {
    logger.error('获取库存信息失败:', error);
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

    // 构建查询配置 - InventoryLog 关联 Inventory 和 Product
    const queryConfig = {
      where,
      include: [
        {
          model: Inventory,
          as: 'inventory',
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'code', 'specification', 'unit'],
              where: productName ? { name: { [Op.like]: `%${productName}%` } } : undefined
            }
          ]
        },
        {
          model: OrderItem,
          as: 'orderItem',
          required: false,  // 左连接，因为orderItem是可选的
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'code']
            }
          ]
        }
      ],
      limit,
      offset,
      order: [['date', 'DESC']]
    };

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
    logger.error('获取库存流水失败:', error);
    next(new AppError('获取库存流水失败', 500));
  }
};