# WMS 仓库管理系统架构图

## 系统整体架构

```mermaid
graph TB
    subgraph "用户层"
        U1[系统管理员]
        U2[仓库经理]
        U3[操作员]
    end
    
    subgraph "前端层 - Vue.js"
        FE[Vue 3 + Element Plus]
        FE_MODULES[
            Vue Router - 路由管理<br/>
            Pinia - 状态管理<br/>
            Axios - HTTP客户端<br/>
            Vite - 构建工具
        ]
    end
    
    subgraph "后端层 - Node.js"
        API[Express.js API 服务器]
        subgraph "中间件层"
            AUTH[JWT 认证中间件]
            LOG[日志中间件]
            CORS[跨域中间件]
        end
        
        subgraph "控制器层"
            C1[用户控制器]
            C2[商品控制器]
            C3[库存控制器]
            C4[订单控制器]
            C5[盘点控制器]
            C6[供应商控制器]
        end
        
        subgraph "服务层"
            S1[用户服务]
            S2[库存服务]
            S3[订单服务]
            S4[通知服务]
            S5[日志服务]
        end
        
        subgraph "数据访问层"
            ORM[Sequelize ORM]
        end
    end
    
    subgraph "数据库层 - MySQL 8.0"
        subgraph "核心业务表"
            T1[users - 用户表]
            T2[products - 商品表]
            T3[inventories - 库存表]
            T4[suppliers - 供应商表]
            T5[categories - 分类表]
        end
        
        subgraph "业务流程表"
            T6[inbound_orders - 入库单]
            T7[outbound_orders - 出库单]
            T8[order_items - 订单明细]
            T9[stocktaking_orders - 盘点单]
            T10[stocktaking_items - 盘点明细]
        end
        
        subgraph "系统日志表"
            T11[inventory_logs - 库存日志]
            T12[messages - 消息通知]
            T13[logs - 操作日志]
        end
    end
    
    subgraph "部署层"
        DOCKER[Docker 容器化]
        COMPOSE[Docker Compose 编排]
    end
    
    U1 --> FE
    U2 --> FE
    U3 --> FE
    
    FE --> API
    FE_MODULES --> FE
    
    API --> AUTH
    API --> LOG
    API --> CORS
    
    AUTH --> C1
    AUTH --> C2
    AUTH --> C3
    AUTH --> C4
    AUTH --> C5
    AUTH --> C6
    
    C1 --> S1
    C2 --> S2
    C3 --> S2
    C4 --> S3
    C5 --> S2
    C6 --> S1
    
    S1 --> ORM
    S2 --> ORM
    S3 --> ORM
    S4 --> ORM
    S5 --> ORM
    
    ORM --> T1
    ORM --> T2
    ORM --> T3
    ORM --> T4
    ORM --> T5
    ORM --> T6
    ORM --> T7
    ORM --> T8
    ORM --> T9
    ORM --> T10
    ORM --> T11
    ORM --> T12
    ORM --> T13
    
    API --> DOCKER
    FE --> DOCKER
    T1 --> DOCKER
    DOCKER --> COMPOSE
```

## 功能模块架构

```mermaid
graph LR
    subgraph "核心功能模块"
        M1[库存管理模块]
        M2[入出库管理模块]
        M3[盘点管理模块]
        M4[供应商管理模块]
        M5[用户权限管理模块]
        M6[操作日志模块]
        M7[消息通知模块]
    end
    
    subgraph "数据流"
        D1[商品数据] --> M1
        D2[库存数据] --> M1
        D3[订单数据] --> M2
        D4[盘点数据] --> M3
        D5[供应商数据] --> M4
        D6[用户数据] --> M5
        D7[日志数据] --> M6
        D8[消息数据] --> M7
    end
    
    M1 --> M2
    M2 --> M6
    M3 --> M1
    M4 --> M2
    M5 --> M1
    M5 --> M2
    M5 --> M3
    M1 --> M7
```

## 技术栈详细说明

### 前端技术栈
- **Vue 3**: 渐进式 JavaScript 框架
- **Element Plus**: Vue 3 UI 组件库
- **Vue Router**: 客户端路由管理
- **Pinia**: 状态管理库
- **Axios**: HTTP 客户端库
- **Vite**: 快速构建工具

### 后端技术栈
- **Node.js**: JavaScript 运行环境
- **Express.js**: Web 应用框架
- **Sequelize**: Promise-based ORM
- **JWT**: JSON Web Token 认证
- **bcryptjs**: 密码哈希库
- **Winston**: 日志记录库

### 数据库设计
- **MySQL 8.0**: 关系型数据库
- **13张核心表**: 支撑完整业务流程
- **外键关联**: 保证数据完整性
- **索引优化**: 提升查询性能

### 部署架构
- **Docker**: 应用容器化
- **Docker Compose**: 多容器编排
- **环境隔离**: 开发/测试/生产环境分离

## 数据流向图

```mermaid
sequenceDiagram
    participant U as 用户
    participant FE as 前端
    participant API as 后端API
    participant DB as 数据库
    
    U->>FE: 1. 用户操作
    FE->>API: 2. HTTP请求
    API->>API: 3. JWT验证
    API->>API: 4. 业务逻辑处理
    API->>DB: 5. 数据库操作
    DB-->>API: 6. 返回数据
    API->>API: 7. 日志记录
    API-->>FE: 8. 响应数据
    FE-->>U: 9. 界面更新
```

## 安全架构

```mermaid
graph TD
    subgraph "安全防护层"
        SEC1[JWT Token 认证]
        SEC2[密码 bcrypt 加密]
        SEC3[CORS 跨域控制]
        SEC4[请求参数验证]
        SEC5[SQL注入防护]
    end
    
    subgraph "权限控制"
        ROLE1[管理员权限]
        ROLE2[经理权限]
        ROLE3[操作员权限]
    end
    
    subgraph "审计追踪"
        AUDIT1[操作日志记录]
        AUDIT2[库存变动追踪]
        AUDIT3[用户行为监控]
    end
    
    SEC1 --> ROLE1
    SEC1 --> ROLE2
    SEC1 --> ROLE3
    
    ROLE1 --> AUDIT1
    ROLE2 --> AUDIT2
    ROLE3 --> AUDIT3
``` 