const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const { InboundOrder } = require('../models/InboundOrder');
const { OutboundOrder } = require('../models/OutboundOrder');
const { StocktakingOrder } = require('../models/StocktakingOrder');
const { AppError } = require('../middleware/errorHandler');
const { StocktakingItem } = require('../models/StocktakingItem');
const { OrderItem, OrderItemType } = require('../models/OrderItem');
const logger = require('../services/loggerService');

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
    logger.error('获取dashboard数据失败:', error);
    if (error.original) {
        logger.error('数据库原始错误:', error.original);
    }
    next(new AppError('获取dashboard数据失败', 500));
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
    logger.error('获取库存预警商品失败:', error);
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
    logger.error('获取近7天出入库趋势失败:', error);
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
    logger.error('获取热门商品失败 - 详细错误:', error);
    if (error.original) {
      logger.error('数据库原始错误:', error.original);
    }
    next(new AppError('获取热门商品失败', 500));
  }
};
