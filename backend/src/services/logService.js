const Log = require('../models/Log');

/**
 * 创建日志记录
 * @param {object} logData 日志数据
 * @param {number} [logData.userId] 用户ID
 * @param {string} [logData.username] 用户名
 * @param {string} logData.actionType 操作类型
 * @param {string} logData.module 操作模块
 * @param {string|object} [logData.details] 操作详情
 * @param {string} [logData.ipAddress] IP地址
 */
async function createLog(logData) {
  try {
    await Log.create({
      userId: logData.userId,
      username: logData.username,
      actionType: logData.actionType,
      module: logData.module,
      details: typeof logData.details === 'object' ? JSON.stringify(logData.details) : logData.details,
      ipAddress: logData.ipAddress,
    });
  } catch (error) {
    console.error('Failed to create log:', error);
    // 根据实际需求，这里可以抛出错误或进行其他处理
  }
}

module.exports = {
  createLog,
}; 