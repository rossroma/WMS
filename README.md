# WMS 仓库管理系统

一个现代化的仓库管理系统，基于 Node.js + Vue.js 构建，提供完整的库存管理、采购订单管理、入出库管理、盘点管理等功能。

## 🚀 项目特性

- **完整的库存管理**：商品管理、库存监控、预警提醒
- **采购订单管理**：采购订单创建、确认、自动生成入库单
- **入出库管理**：支持采购入库、销售出库、盘点调整等多种业务场景
- **盘点管理**：系统化的库存盘点流程，支持盘盈盘亏自动处理
- **供应商管理**：供应商信息维护和管理
- **用户权限管理**：多角色权限控制（管理员、经理、操作员）
- **操作日志**：完整的操作审计追踪
- **消息通知**：库存预警等实时消息推送
- **现代化UI**：基于 Vue 3 + Element Plus 的响应式界面
- **业务关联管理**：采购单与入库单、盘点单与出入库单的完整关联追踪

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

## 📋 核心业务逻辑

### 采购订单流程
1. **创建采购订单** → 自动生成采购明细
2. **采购订单确认** → 自动创建采购入库单
3. **删除采购订单** → 检查关联入库单，如存在则不允许删除

### 盘点管理流程
1. **创建盘点单** → 自动生成盘点明细（系统库存快照）
2. **录入实际盘点数量** → 系统自动计算盘盈盘亏
3. **盘盈处理** → 自动创建盘盈入库单，增加库存
4. **盘亏处理** → 自动创建盘亏出库单，减少库存
5. **删除盘点单** → 检查关联出入库单，如存在则不允许删除

### 入库单管理
1. **创建入库单** → 自动生成订单明细
2. **入库确认** → 更新商品库存 + 创建库存流水记录
3. **删除入库单** → 删除明细 + 回退库存 + 删除库存流水

### 出库单管理
1. **创建出库单** → 自动生成订单明细
2. **出库确认** → 更新商品库存 + 创建库存流水记录
3. **删除出库单** → 删除明细 + 恢复库存 + 删除库存流水

### 关联关系追踪
- **入库单关联来源**：采购单、盘点单（盘盈）、手动创建
- **出库单关联来源**：盘点单（盘亏）、手动创建
- **前端显示**：所有单据列表都显示关联来源标识
- **删除保护**：有关联关系的单据不允许删除，确保数据一致性