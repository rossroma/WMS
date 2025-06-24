# WMS 仓库管理系统

一个现代化的仓库管理系统，基于 Node.js + Vue.js 构建，提供完整的库存管理、采购订单管理、入出库管理、盘点管理等功能。

## 🚀 项目特性

- **完整的库存管理**：商品管理、库存监控、预警提醒
- **采购订单管理**：采购订单创建、确认、自动生成入库单
- **入出库管理**：支持采购入库、销售出库等多种业务场景
- **盘点管理**：系统化的库存盘点流程
- **供应商管理**：供应商信息维护和管理
- **用户权限管理**：多角色权限控制（管理员、经理、操作员）
- **操作日志**：完整的操作审计追踪
- **消息通知**：库存预警等实时消息推送
- **现代化UI**：基于 Vue 3 + Element Plus 的响应式界面

## 🛠 技术栈

### 后端
- **Node.js** - 运行环境
- **Express.js** - Web 框架
- **Sequelize** - ORM 数据库操作
- **MySQL 8.0** - 数据库
- **JWT** - 身份认证
- **bcryptjs** - 密码加密
- **Winston** - 日志管理

### 前端
- **Vue 3** - 前端框架
- **Element Plus** - UI 组件库
- **Vue Router** - 路由管理
- **Pinia** - 状态管理
- **Axios** - HTTP 客户端
- **Vite** - 构建工具

### 部署
- **Docker** - 容器化部署
- **Docker Compose** - 服务编排

## 📋 环境要求

- Node.js 16+
- Docker & Docker Compose
- MySQL 8.0+

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd WMS
```

### 2. 启动数据库
```bash
cd backend
docker-compose up -d
```

### 3. 安装后端依赖并启动
```bash
npm install
npm start
```

### 4. 安装前端依赖并启动
```bash
cd ../frontend
npm install
npm run dev
```

### 5. 访问应用
- 前端地址：http://localhost:5173
- 后端API：http://localhost:3000

## 👤 默认账户

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 系统管理员 | admin | 123456 | 全部权限 |
| 仓库经理 | manager | 123456 | 管理权限 |
| 操作员 | operator | 123456 | 基础操作 |

## 📁 项目结构

```
WMS/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── config/            # 配置文件
│   │   ├── controllers/       # 控制器
│   │   ├── middleware/        # 中间件
│   │   ├── models/           # 数据模型
│   │   ├── routes/           # 路由定义
│   │   ├── services/         # 业务服务
│   │   └── utils/            # 工具函数
│   ├── docker/               # Docker 配置
│   │   └── mysql/           # 数据库初始化脚本
│   ├── logs/                # 日志文件
│   ├── .env                 # 环境变量
│   └── docker-compose.yml   # Docker 编排
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── components/      # 组件
│   │   ├── views/          # 页面
│   │   ├── router/         # 路由
│   │   ├── stores/         # 状态管理
│   │   └── utils/          # 工具函数
│   └── public/             # 静态资源
└── README.md               # 项目说明
```

## 🗄 数据库设计

### 核心表结构
- **users** - 用户表
- **suppliers** - 供应商表
- **categories** - 商品分类表
- **products** - 商品表
- **inventories** - 库存表
- **purchase_orders** - 采购订单表
- **purchase_order_items** - 采购订单明细表
- **inbound_orders** - 入库单表
- **outbound_orders** - 出库单表
- **order_items** - 订单明细表
- **stocktaking_orders** - 盘点单表
- **stocktaking_items** - 盘点明细表
- **inventory_logs** - 库存变动日志表
- **messages** - 消息通知表
- **logs** - 操作日志表

## 🔧 配置说明

### 环境变量配置
复制 `.env.example` 为 `.env` 并修改相应配置：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wms_db
DB_USER=root
DB_PASSWORD=root123

# JWT 配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# 服务配置
PORT=3000
NODE_ENV=development
```

## 🚀 部署指南

### Docker 部署
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```