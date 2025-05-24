const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const config = require('./config/config');
const logger = require('./services/loggerService');
const { errorHandler } = require('./middleware/errorHandler');
const sequelize = require('./config/database');
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const inboundOrderRoutes = require('./routes/inboundOrderRoutes');
const outboundOrderRoutes = require('./routes/outboundOrderRoutes');
const stocktakingOrderRoutes = require('./routes/stocktakingOrderRoutes');
const messageRoutes = require('./routes/messageRoutes');
const authRoutes = require('./routes/authRoutes');
const roleRoutes = require('./routes/roleRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const logRoutes = require('./routes/logRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { initCronJobs } = require('./services/cronService');
const userRoutes = require('./routes/userRoutes');
const { scheduleOrderCleanup, scheduleInventoryCheck } = require('./config/cron');

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

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger API文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "WMS API Documentation"
}));

// 初始化定时任务
try {
  scheduleOrderCleanup();
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
app.use('/api/roles', roleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);

// 错误处理中间件
app.use(errorHandler);

// 创建HTTP服务器
const server = http.createServer(app);

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

// WebSocket连接处理
wss.on('connection', (ws) => {
  logger.info('新的WebSocket连接');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      logger.info('收到WebSocket消息:', data);
    } catch (error) {
      logger.error('WebSocket消息解析错误:', error);
    }
  });

  ws.on('error', (error) => {
    logger.error('WebSocket错误:', error);
  });

  ws.on('close', () => {
    logger.info('WebSocket连接关闭');
  });
});

// 启动服务器
const PORT = config.server.port;
server.listen(PORT, () => {
  logger.info(`服务器运行在端口 ${PORT}`);
  logger.info(`API文档地址: http://localhost:${PORT}/api-docs`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，准备关闭服务器');
  server.close(() => {
    logger.info('服务器已关闭');
    sequelize.close().then(() => {
      logger.info('数据库连接已关闭');
      process.exit(0);
    });
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

module.exports = { app, server }; 