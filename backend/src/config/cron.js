const cron = require('node-cron');
const { Op } = require('sequelize');
const { Message } = require('../models/Message');
const InventoryLog = require('../models/InventoryLog');
const Log = require('../models/Log');
const logger = require('../services/loggerService');
const config = require('./config');

// 存储定时任务实例
const cronTasks = {
  logCleanupTask: null,
  messageCleanupTask: null,
  inventoryLogCleanupTask: null
};

/**
 * 重试机制
 * @param {Function} fn 要执行的函数
 * @param {number} retries 重试次数
 * @param {number} delay 延迟时间（毫秒）
 */
const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    logger.warn(`操作失败，${delay}ms后重试，剩余重试次数：${retries}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
};

/**
 * 清理超过指定天数的日志信息
 */
const cleanOldLogs = async () => {
  try {
    const retentionDays = config.cron.logCleanup.retentionDays;
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - retentionDays);

    logger.info(`开始清理 ${retentionDays} 天前的历史日志，截止日期：${retentionDate.toISOString()}`);

    const result = await retry(async () => {
      return await Log.destroy({
        where: {
          createdAt: {
            [Op.lt]: retentionDate
          }
        }
      });
    }, config.cron.retryAttempts);

    logger.info(`清理历史日志任务完成，共删除 ${result} 条记录`);
  } catch (error) {
    logger.error('清理历史日志任务失败:', error);
  }
};

/**
 * 清理超过指定天数的消息数据
 */
const cleanOldMessages = async () => {
  try {
    const retentionDays = config.cron.messageCleanup.retentionDays;
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - retentionDays);

    logger.info(`开始清理 ${retentionDays} 天前的历史消息，截止日期：${retentionDate.toISOString()}`);

    const result = await retry(async () => {
      return await Message.destroy({
        where: {
          createdAt: {
            [Op.lt]: retentionDate
          }
        }
      });
    }, config.cron.retryAttempts);

    logger.info(`清理历史消息任务完成，共删除 ${result} 条记录`);
  } catch (error) {
    logger.error('清理历史消息任务失败:', error);
  }
};

/**
 * 清理超过指定天数的库存流水数据
 */
const cleanOldInventoryLogs = async () => {
  try {
    const retentionDays = config.cron.inventoryLogCleanup.retentionDays;
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - retentionDays);

    logger.info(`开始清理 ${retentionDays} 天前的库存流水数据，截止日期：${retentionDate.toISOString()}`);

    const result = await retry(async () => {
      return await InventoryLog.destroy({
        where: {
          createdAt: {
            [Op.lt]: retentionDate
          }
        }
      });
    }, config.cron.retryAttempts);

    logger.info(`清理库存流水任务完成，共删除 ${result} 条记录`);
  } catch (error) {
    logger.error('清理库存流水任务失败:', error);
  }
};

/**
 * 启动定时任务
 */
const startCronJobs = () => {
  try {
    // 日志清理任务
    const logCleanupSchedule = config.cron.logCleanup.schedule;
    cronTasks.logCleanupTask = cron.schedule(logCleanupSchedule, () => {
      logger.info('开始执行定时清理历史日志任务');
      cleanOldLogs();
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai'
    });
    logger.info(`日志清理定时任务已启动，执行时间：${logCleanupSchedule}`);

    // 消息清理任务
    const messageCleanupSchedule = config.cron.messageCleanup.schedule;
    cronTasks.messageCleanupTask = cron.schedule(messageCleanupSchedule, () => {
      logger.info('开始执行定时清理历史消息任务');
      cleanOldMessages();
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai'
    });
    logger.info(`消息清理定时任务已启动，执行时间：${messageCleanupSchedule}`);

    // 库存流水清理任务
    const inventoryLogCleanupSchedule = config.cron.inventoryLogCleanup.schedule;
    cronTasks.inventoryLogCleanupTask = cron.schedule(inventoryLogCleanupSchedule, () => {
      logger.info('开始执行定时清理库存流水任务');
      cleanOldInventoryLogs();
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai'
    });
    logger.info(`库存流水清理定时任务已启动，执行时间：${inventoryLogCleanupSchedule}`);

  } catch (error) {
    logger.error('启动定时任务失败:', error);
  }
};

/**
 * 停止所有定时任务
 */
const stopCronJobs = () => {
  try {
    Object.keys(cronTasks).forEach(taskName => {
      const task = cronTasks[taskName];
      if (task) {
        task.stop();
        logger.info(`定时任务 ${taskName} 已停止`);
        cronTasks[taskName] = null;
      }
    });
  } catch (error) {
    logger.error('停止定时任务失败:', error);
  }
};

module.exports = {
  startCronJobs,
  stopCronJobs,
  cleanOldLogs,
  cleanOldMessages,
  cleanOldInventoryLogs
}; 