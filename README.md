# WMS 仓库管理系统

## 项目说明
这是一个基于 Node.js 和 MySQL 的仓库管理系统后端服务。

## 环境要求
- Docker
- Docker Compose
- Node.js 14+
- MySQL 8.0+

## 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd wms
```

### 2. 配置环境变量
```bash
cp .env.example .env
```
然后编辑 `.env` 文件，设置必要的环境变量。

### 3. 启动 MySQL 数据库
```bash
docker-compose up -d mysql
```

### 4. 安装依赖
```bash
cd backend
npm install
```

### 5. 启动服务
```bash
npm run dev
```

## 数据库初始化
项目使用 Docker 自动初始化数据库，包括：
- 创建数据库和用户
- 创建所有必要的表
- 插入基础数据（角色和管理员用户）

## 默认管理员账号
- 用户名：admin
- 密码：admin123

## 项目结构
```
backend/
├── src/
│   ├── config/         # 配置文件
│   ├── controllers/    # 控制器
│   ├── middleware/     # 中间件
│   ├── models/         # 数据模型
│   ├── routes/         # 路由
│   ├── services/       # 服务
│   └── utils/          # 工具函数
├── docker/            # Docker 相关文件
│   └── mysql/         # MySQL 初始化脚本
├── .env              # 环境变量
├── .env.example      # 环境变量模板
└── docker-compose.yml # Docker 编排文件
```

## API 文档
API 文档使用 Swagger 生成，启动服务后访问：
```
http://localhost:3000/api-docs
```

## 开发指南
1. 代码规范遵循 ESLint 配置
2. 提交代码前请运行测试
3. 遵循 Git Flow 工作流

## 部署
1. 构建 Docker 镜像
```bash
docker-compose build
```

2. 启动服务
```bash
docker-compose up -d
```

## 维护
- 日志文件位于 `logs` 目录
- 数据库备份位于 `backup` 目录
- 定时任务日志可在管理界面查看

## 许可证
MIT 