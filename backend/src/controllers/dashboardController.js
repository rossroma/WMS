const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const { InboundOrder } = require('../models/InboundOrder');
const { OutboundOrder } = require('../models/OutboundOrder');
const { StocktakingOrder } = require('../models/StocktakingOrder');
const Message = require('../models/Message');
const { AppError } = require('../middleware/errorHandler');
const { StocktakingItem } = require('../models/StocktakingItem');
const { OrderItem, OrderItemType } = require('../models/OrderItem');

// 获取综合dashboard数据
exports.getDashboardData = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // 今日入库数量
    const todayInbound = await InboundOrder.sum('totalQuantity', {
      where: {
        createdAt: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    }) || 0;

    // 今日出库数量
    const todayOutbound = await OutboundOrder.sum('totalQuantity', {
      where: {
        createdAt: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    }) || 0;

    // 库存预警商品数量
    const warningProducts = await Inventory.findAll({
      include: [{
        model: Product,
        where: {
          stockAlertQuantity: {
            [Op.gt]: 0
          }
        }
      }]
    });
    const stockWarning = warningProducts.filter(inv => inv.quantity < inv.Product.stockAlertQuantity).length;

    // 盘点准确率（最近30天）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const stocktakingOrders = await StocktakingOrder.findAll({
      where: {
        stocktakingDate: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      include: [{
        model: StocktakingItem,
        as: 'items',
        attributes: ['systemQuantity', 'actualQuantity']
      }]
    });

    let stocktakingAccuracy = 100;
    if (stocktakingOrders.length > 0) {
      let accurateOrderCount = 0;
      for (const order of stocktakingOrders) {
        if (order.items && order.items.length > 0) {
          const allItemsAccurate = order.items.every(item => 
            item.actualQuantity !== null && item.actualQuantity === item.systemQuantity
          );
          if (allItemsAccurate) {
            accurateOrderCount++;
          }
        }
      }
      const relevantOrderCount = stocktakingOrders.filter(o => o.items && o.items.length > 0).length;
      if (relevantOrderCount > 0) {
         stocktakingAccuracy = ((accurateOrderCount / relevantOrderCount) * 100).toFixed(1);
      } else {
        stocktakingAccuracy = 100;
      }
    }

    // 库存总量
    const totalInventory = await Inventory.sum('quantity') || 0;

    // 商品种类数
    const productCount = await Product.count();

    // 库存总价值
    const inventoryValue = await Inventory.findAll({
      include: [{
        model: Product,
        attributes: ['purchasePrice']
      }]
    }).then(inventories => 
      inventories.reduce((sum, inv) => sum + (inv.quantity * (inv.Product.purchasePrice || 0)), 0)
    );

    res.json({
      status: 'success',
      message: '获取dashboard数据成功',
      data: {
        todayInbound,
        todayOutbound,
        stockWarning,
        stocktakingAccuracy: parseFloat(stocktakingAccuracy),
        totalInventory,
        productCount,
        inventoryValue
      }
    });
  } catch (error) {
    console.error('获取dashboard数据失败:', error);
    if (error.original) {
        console.error('数据库原始错误:', error.original);
    }
    next(new AppError('获取dashboard数据失败', 500));
  }
};

// 获取今日入库数量
exports.getTodayInboundCount = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const count = await InboundOrder.sum('totalQuantity', {
      where: {
        createdAt: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    }) || 0;

    res.json({
      status: 'success',
      message: '获取今日入库数量成功',
      data: { count }
    });
  } catch (error) {
    console.error('获取今日入库数量失败:', error);
    next(new AppError('获取今日入库数量失败', 500));
  }
};

// 获取今日出库数量
exports.getTodayOutboundCount = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const count = await OutboundOrder.sum('totalQuantity', {
      where: {
        createdAt: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    }) || 0;

    res.json({
      status: 'success',
      message: '获取今日出库数量成功',
      data: { count }
    });
  } catch (error) {
    console.error('获取今日出库数量失败:', error);
    next(new AppError('获取今日出库数量失败', 500));
  }
};

// 获取库存预警商品
exports.getWarningProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const warningProducts = await Inventory.findAll({
      include: [{
        model: Product,
        where: {
          stockAlertQuantity: {
            [Op.gt]: 0
          }
        },
        attributes: ['id', 'name', 'code', 'specification', 'unit', 'stockAlertQuantity']
      }],
      limit: parseInt(limit)
    });

    const filteredProducts = warningProducts
      .filter(inv => inv.quantity < inv.Product.stockAlertQuantity)
      .map(inv => ({
        id: inv.Product.id,
        name: inv.Product.name,
        code: inv.Product.code,
        specification: inv.Product.specification,
        unit: inv.Product.unit,
        currentStock: inv.quantity,
        warningStock: inv.Product.stockAlertQuantity
      }));

    res.json({
      status: 'success',
      message: '获取库存预警商品成功',
      data: filteredProducts
    });
  } catch (error) {
    console.error('获取库存预警商品失败:', error);
    next(new AppError('获取库存预警商品失败', 500));
  }
};

// 获取近7天出入库趋势
exports.getWeeklyTrend = async (req, res, next) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // 最近7天

    const dates = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }

    const trendData = await Promise.all(dates.map(async (date) => {
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const inboundCount = await InboundOrder.sum('totalQuantity', {
        where: {
          createdAt: {
            [Op.between]: [dayStart, dayEnd]
          }
        }
      }) || 0;

      const outboundCount = await OutboundOrder.sum('totalQuantity', {
        where: {
          createdAt: {
            [Op.between]: [dayStart, dayEnd]
          }
        }
      }) || 0;

      return {
        date: date.toISOString().split('T')[0],
        inbound: inboundCount,
        outbound: outboundCount
      };
    }));

    res.json({
      status: 'success',
      message: '获取近7天出入库趋势成功',
      data: trendData
    });
  } catch (error) {
    console.error('获取近7天出入库趋势失败:', error);
    next(new AppError('获取近7天出入库趋势失败', 500));
  }
};

// 获取热门商品（近30天销售出库数量最多的商品）
exports.getHotProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topSoldProducts = await OrderItem.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSoldQuantity']
      ],
      include: [
        {
          model: OutboundOrder,
          attributes: [], // 不需要出库单的任何字段，仅用于筛选
          where: {
            orderDate: { // 根据出库单的日期筛选
              [Op.gte]: thirtyDaysAgo
            }
          },
          required: true // 强制内连接，只找出库日期在范围内的订单明细
        },
        {
          model: Product,
          attributes: ['id', 'name', 'code', 'specification'],
          required: true, // 确保只包含有对应商品信息的明细
        }
      ],
      where: {
        orderType: OrderItemType.OUTBOUND
      },
      group: [
        'productId', 
        'Product.id', // 所有包含在 SELECT 非聚合列和 include 中的模型的主键/属性都需要在 GROUP BY 中
        'Product.name',
        'Product.code',
        'Product.specification',
      ],
      order: [[sequelize.literal('totalSoldQuantity'), 'DESC']],
      limit: parseInt(limit),
      raw: false, // 非常重要，当使用 include 和 group 时，为了正确映射嵌套对象，通常需要 raw: false
      subQuery: false // 在某些复杂分组和聚合的场景下可能需要调整
    });

    const result = topSoldProducts.map(item => {
      const productData = item.Product; // 或者 item.get('Product') 如果是 Sequelize 实例
      return {
        product: {
          id: productData.id,
          name: productData.name,
          code: productData.code,
          specification: productData.specification,
        },
        quantity: parseInt(item.get('totalSoldQuantity'), 10) // get() 用于获取聚合别名
      };
    });

    res.json({
      status: 'success',
      message: '获取热门商品成功',
      data: result
    });
  } catch (error) {
    console.error('获取热门商品失败 - 详细错误:', error);
    if (error.original) {
      console.error('数据库原始错误:', error.original);
    }
    next(new AppError('获取热门商品失败', 500));
  }
};

// 获取库存概览数据
exports.getInventoryOverview = async (req, res, next) => {
  try {
    // 获取库存总量
    const totalInventory = await Inventory.sum('quantity');
    
    // 获取库存商品种类数
    const productCount = await Product.count();
    
    // 获取库存预警商品数
    const alertCount = await Inventory.findAll({
      include: [{
        model: Product,
        where: {
          stockAlertQuantity: {
            [Op.gt]: 0
          }
        }
      }]
    }).then(inventories => 
      inventories.filter(inv => inv.quantity < inv.Product.stockAlertQuantity).length
    );

    // 获取库存价值（假设每个商品都有price字段）
    const inventoryValue = await Inventory.findAll({
      include: [{
        model: Product,
        attributes: ['purchasePrice']
      }]
    }).then(inventories => 
      inventories.reduce((sum, inv) => sum + (inv.quantity * inv.Product.purchasePrice), 0)
    );

    res.json({
      status: 'success',
      message: '获取库存概览成功',
      data: {
        totalInventory,
        productCount,
        alertCount,
        inventoryValue
      }
    });
  } catch (error) {
    console.error('获取库存概览失败:', error);
    next(new AppError('获取库存概览失败', 500));
  }
};

// 获取出入库统计
exports.getInOutStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = {};
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // 入库统计
    const inboundStats = await InboundOrder.findAll({
      where: whereClause,
      attributes: [
        'type',
        [sequelize.fn('SUM', sequelize.col('totalQuantity')), 'totalQuantity'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      group: ['type']
    });

    // 出库统计
    const outboundStats = await OutboundOrder.findAll({
      where: whereClause,
      attributes: [
        'type',
        [sequelize.fn('SUM', sequelize.col('totalQuantity')), 'totalQuantity'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      group: ['type']
    });

    res.json({
      status: 'success',
      message: '获取出入库统计成功',
      data: {
        inbound: inboundStats,
        outbound: outboundStats
      }
    });
  } catch (error) {
    console.error('获取出入库统计失败:', error);
    next(new AppError('获取出入库统计失败', 500));
  }
};

// 获取盘点统计
exports.getStocktakingStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = {};
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // 盘点单统计
    const stocktakingStats = await StocktakingOrder.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalCount'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN actualQuantity > recordedQuantity THEN 1 ELSE 0 END')), 'gainCount'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN actualQuantity < recordedQuantity THEN 1 ELSE 0 END')), 'lossCount']
      ]
    });

    res.json({
      status: 'success',
      message: '获取盘点统计成功',
      data: stocktakingStats[0]
    });
  } catch (error) {
    console.error('获取盘点统计失败:', error);
    next(new AppError('获取盘点统计失败', 500));
  }
};

// 获取消息统计
exports.getMessageStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = {};
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // 消息类型统计
    const messageStats = await Message.findAll({
      where: whereClause,
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type']
    });

    res.json({
      status: 'success',
      message: '获取消息统计成功',
      data: messageStats
    });
  } catch (error) {
    console.error('获取消息统计失败:', error);
    next(new AppError('获取消息统计失败', 500));
  }
};

// 获取库存趋势数据
exports.getInventoryTrend = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 获取每日库存总量
    const dailyInventory = await Inventory.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity']
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
    });

    res.json({
      status: 'success',
      message: '获取库存趋势成功',
      data: dailyInventory
    });
  } catch (error) {
    console.error('获取库存趋势失败:', error);
    next(new AppError('获取库存趋势失败', 500));
  }
};

// 获取热门商品排行
exports.getTopProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const topProducts = await Inventory.findAll({
      include: [{
        model: Product,
        attributes: ['name', 'code'],
        required: true,
      }],
      attributes: ['quantity'],
      order: [['quantity', 'DESC']],
      limit: parseInt(limit)
    });

    const result = topProducts.map(item => ({
      product: {
        name: item.Product.name,
        code: item.Product.code
      },
      quantity: item.quantity
    }));

    res.json({
      status: 'success',
      message: '获取热门商品排行成功',
      data: result
    });
  } catch (error) {
    console.error('获取热门商品排行失败 - 详细错误:', error);
    if (error.original) {
      console.error('数据库原始错误:', error.original);
    }
    next(new AppError('获取热门商品排行失败', 500));
  }
}; 