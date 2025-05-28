const cron = require('node-cron');
const { Op } = require('sequelize');
const Message = require('../models/Message');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const logger = require('./loggerService');
const config = require('../config/config');

// 任务状态
const taskStatus = {
  messageCleanup: {
    lastRun: null,
    isRunning: false,
    error: null
  },
  inventoryCheck: {
    lastRun: null,
    isRunning: false,
    error: null
  }
};

// 重试机制
const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
};

// 清理超过指定天数的历史消息
const cleanOldMessages = async () => {
  if (taskStatus.messageCleanup.isRunning) {
    logger.warn('清理历史消息任务正在运行中');
    return;
  }

  taskStatus.messageCleanup.isRunning = true;
  taskStatus.messageCleanup.error = null;

  try {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - config.cron.messageCleanup.retentionDays);

    const result = await retry(async () => {
      return Message.destroy({
        where: {
          createdAt: {
            [Op.lt]: retentionDate
          }
        }
      });
    }, config.cron.inventoryCheck.retryAttempts);

    logger.info(`已清理 ${result} 条历史消息`);
    taskStatus.messageCleanup.lastRun = new Date();
  } catch (error) {
    logger.error('清理历史消息失败:', error);
    taskStatus.messageCleanup.error = error.message;
  } finally {
    taskStatus.messageCleanup.isRunning = false;
  }
};

// 检查库存预警
const checkInventoryAlerts = async () => {
  if (taskStatus.inventoryCheck.isRunning) {
    logger.warn('库存预警检查任务正在运行中');
    return;
  }

  taskStatus.inventoryCheck.isRunning = true;
  taskStatus.inventoryCheck.error = null;

  try {
    const inventories = await retry(async () => {
      return Inventory.findAll({
        include: [{
          model: Product,
          where: {
            stockAlertQuantity: {
              [Op.gt]: 0
            }
          }
        }]
      });
    }, config.cron.inventoryCheck.retryAttempts);

    for (const inventory of inventories) {
      if (inventory.quantity < inventory.Product.stockAlertQuantity) {
        await Message.create({
          content: `库存预警：商品${inventory.Product.name}的库存低于预警阈值。`,
          type: 'INVENTORY_ALERT',
          relatedId: inventory.id
        });
      }
    }

    logger.info('库存预警检查完成');
    taskStatus.inventoryCheck.lastRun = new Date();
  } catch (error) {
    logger.error('库存预警检查失败:', error);
    taskStatus.inventoryCheck.error = error.message;
  } finally {
    taskStatus.inventoryCheck.isRunning = false;
  }
};

// 获取任务状态
const getTaskStatus = () => {
  return {
    messageCleanup: {
      ...taskStatus.messageCleanup,
      lastRun: taskStatus.messageCleanup.lastRun?.toISOString() || null
    },
    inventoryCheck: {
      ...taskStatus.inventoryCheck,
      lastRun: taskStatus.inventoryCheck.lastRun?.toISOString() || null
    }
  };
};

// 初始化定时任务
const initCronJobs = () => {
  // 每天凌晨2点执行清理历史消息
  cron.schedule(config.cron.messageCleanup.schedule, () => {
    logger.info('开始执行清理历史消息任务');
    cleanOldMessages();
  });

  // 每小时检查一次库存预警
  cron.schedule(config.cron.inventoryCheck.schedule, () => {
    logger.info('开始执行库存预警检查任务');
    checkInventoryAlerts();
  });

  logger.info('定时任务已初始化');
};

module.exports = {
  initCronJobs,
  cleanOldMessages,
  checkInventoryAlerts,
  getTaskStatus
}; 