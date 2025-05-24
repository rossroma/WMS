const cron = require('node-cron');
const { Op } = require('sequelize');
// const { Order } = require('../models/Order');  // 暂时注释掉
const { sequelize } = require('./database');

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
  console.log('定时任务已暂时禁用');
};

module.exports = {
  scheduleOrderCleanup
}; 