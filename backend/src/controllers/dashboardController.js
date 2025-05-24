const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const InboundOrder = require('../models/InboundOrder');
const OutboundOrder = require('../models/OutboundOrder');
const StocktakingOrder = require('../models/StocktakingOrder');
const Message = require('../models/Message');
const { AppError } = require('../middleware/errorHandler');

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
        attributes: ['price']
      }]
    }).then(inventories => 
      inventories.reduce((sum, inv) => sum + (inv.quantity * inv.Product.price), 0)
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
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      group: ['type']
    });

    // 出库统计
    const outboundStats = await OutboundOrder.findAll({
      where: whereClause,
      attributes: [
        'type',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
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
    next(new AppError('获取库存趋势失败', 500));
  }
};

// 获取热门商品排行
exports.getTopProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    // 获取出库量最大的商品
    const topOutboundProducts = await OutboundOrder.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity']
      ],
      include: [{
        model: Product,
        attributes: ['name', 'code']
      }],
      group: ['productId'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      status: 'success',
      message: '获取热门商品排行成功',
      data: topOutboundProducts
    });
  } catch (error) {
    next(new AppError('获取热门商品排行失败', 500));
  }
}; 