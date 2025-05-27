const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/config');
const logger = require('./services/loggerService');
const { errorHandler } = require('./middleware/errorHandler');
const sequelize = require('./config/database');

// 导入模型关联配置
require('./models/associations');

const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const inboundOrderRoutes = require('./routes/inboundOrderRoutes');
const outboundOrderRoutes = require('./routes/outboundOrderRoutes');
const stocktakingOrderRoutes = require('./routes/stocktakingOrderRoutes');
const messageRoutes = require('./routes/messageRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const logRoutes = require('./routes/logRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { initCronJobs } = require('./services/cronService');
const userRoutes = require('./routes/userRoutes');
const { scheduleOrderCleanup, scheduleInventoryCheck, scheduleLogCleanup } = require('./config/cron');

// 创建Express应用
const app = express();

// 跨域配置
app.use(cors({
  origin: config.server.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 请求体解析
app.use(express.json({ limit: '10kb' })); // 限制请求体大小为10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 压缩响应
app.use(compression());

// 日志中间件
app.use(morgan('combined', {
  stream: {
    write: message => logger.info(message.trim())
  }
}));

// 初始化定时任务
try {
  scheduleOrderCleanup();
  scheduleLogCleanup();
} catch (error) {
  console.error('定时任务初始化失败:', error);
}

// 测试数据库连接
sequelize.authenticate()
  .then(() => logger.info('数据库连接成功'))
  .catch(err => logger.error('数据库连接失败:', err));

// 路由
app.get('/', (req, res) => {
  res.send('Hello, WMS Backend!');
});

// API路由
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/inbound-orders', inboundOrderRoutes);
app.use('/api/outbound-orders', outboundOrderRoutes);
app.use('/api/stocktaking-orders', stocktakingOrderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const PORT = config.server.port;
app.listen(PORT, () => {
  logger.info(`服务器运行在端口 ${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，准备关闭服务器');
  sequelize.close().then(() => {
    logger.info('数据库连接已关闭');
    process.exit(0);
  });
});

// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  // 可以在这里添加错误日志记录
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
  // 可以在这里添加错误日志记录
});

module.exports = app; 