// const cron = require('node-cron'); // 暂时注释，因为当前未使用
// const { Op } = require('sequelize'); // 暂时注释，因为当前未使用
// const Log = require('../models/Log'); // 暂时注释，因为当前未使用
// const { Order } = require('../models/Order');  // 暂时注释掉
// const { sequelize } = require('./database'); // 暂时注释，因为当前未使用

// 暂时注释掉定时任务
const scheduleOrderCleanup = () => {
  // cron.schedule('0 2 * * *', async () => {
  //   const thirtyDaysAgo = new Date();
  //   thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  //   await Order.destroy({
  //     where: {
  //       status: 'completed',
  //       updatedAt: {
  //         [Op.lt]: thirtyDaysAgo
  //       }
  //     }
  //   });

  //   console.log('订单清理任务执行完成');
  // });
  console.log('订单清理任务已暂时禁用');
};

// 新增：定时删除旧日志任务 (例如每天凌晨3点执行)
const scheduleLogCleanup = () => {
  // cron.schedule('0 3 * * *', async () => { // '0 3 * * *' 表示每天凌晨3点
  //   try {
  //     const threeMonthsAgo = new Date();
  //     threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  //     const result = await Log.destroy({
  //       where: {
  //         createdAt: {
  //           [Op.lt]: threeMonthsAgo,
  //         },
  //       },
  //     });
  //     console.log(`旧日志清理完成，删除了 ${result} 条记录。`);
  //   } catch (error) {
  //     console.error('旧日志清理任务执行失败:', error);
  //   }
  // });
  console.log('旧日志清理任务已暂时禁用，请取消注释以启用。');
};

module.exports = {
  scheduleOrderCleanup,
  scheduleLogCleanup, // 导出新任务
}; 