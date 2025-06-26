const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const { InboundOrder } = require('../models/InboundOrder');
const { OutboundOrder, OutboundType } = require('../models/OutboundOrder');
const { StocktakingOrder } = require('../models/StocktakingOrder');
const { AppError } = require('../middleware/errorHandler');
const { StocktakingItem } = require('../models/StocktakingItem');
const { OrderItemType } = require('../models/OrderItem');
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

    const topSoldProducts = await sequelize.query(`
      SELECT 
        oi.product_id as productId,
        SUM(oi.quantity) as totalSoldQuantity,
        p.id as 'Product.id',
        p.name as 'Product.name', 
        p.code as 'Product.code',
        p.specification as 'Product.specification'
      FROM order_items oi
      INNER JOIN outbound_orders ob ON oi.order_id = ob.id 
        AND ob.order_date >= :thirtyDaysAgo 
        AND ob.type = :saleType
      INNER JOIN products p ON oi.product_id = p.id
      WHERE oi.order_type = :outboundType
      GROUP BY oi.product_id, p.id, p.name, p.code, p.specification
      ORDER BY totalSoldQuantity DESC
      LIMIT :limit
    `, {
      replacements: {
        thirtyDaysAgo,
        saleType: OutboundType.SALE,
        outboundType: OrderItemType.OUTBOUND,
        limit: parseInt(limit)
      },
      type: sequelize.QueryTypes.SELECT
    });

    const result = topSoldProducts.map(item => {
      return {
        product: {
          id: item['Product.id'],
          name: item['Product.name'],
          code: item['Product.code'],
          specification: item['Product.specification'],
        },
        quantity: parseInt(item.totalSoldQuantity, 10)
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
