# WMS 仓库管理系统数据库表结构文档

## 目录
1. [用户管理](#用户管理)
2. [商品管理](#商品管理)
3. [库存管理](#库存管理)
4. [订单管理](#订单管理)
5. [盘点管理](#盘点管理)
6. [系统管理](#系统管理)
7. [模型关联关系](#模型关联关系)

---

## 用户管理

### Users 用户表
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | 用户ID |
| username | STRING | NOT NULL, UNIQUE, 长度3-50 | 用户名 |
| password | STRING | NOT NULL | 密码（加密存储） |
| email | STRING | NOT NULL, UNIQUE, EMAIL格式 | 邮箱 |
| fullname | STRING | NOT NULL | 姓名 |
| role | ENUM | NOT NULL | 角色：admin/manager/operator |
| status | ENUM | - | 状态：active/inactive/suspended |
| phone | STRING | - | 电话 |
| lastLoginAt | DATE | - | 最后登录时间 |
| createdAt | DATE | AUTO | 创建时间 |
| updatedAt | DATE | AUTO | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE (username)
- UNIQUE (email)

---

## 商品管理

### Categories 分类表
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | 分类ID |
| name | STRING | NOT NULL | 分类名称 |
| parentId | INTEGER | FOREIGN KEY | 父分类ID |
| level | INTEGER | NOT NULL | 分类级别 |
| sort | INTEGER | - | 排序 |
| createdAt | DATE | AUTO | 创建时间 |
| updatedAt | DATE | AUTO | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- FOREIGN KEY (parentId) REFERENCES Categories(id)

### Suppliers 供应商表
| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | 供应商ID |
| name | STRING | NOT NULL | - | 供应商名称 |
| contactPerson | STRING | - | - | 联系人 |
| address | STRING | - | - | 地址 |
| email | STRING | - | - | 邮箱 |
| phone | STRING | - | - | 电话 |
| creditRating | INTEGER | - | - | 信用等级 |
| paymentMethod | STRING | - | - | 付款方式 |
| manager | STRING | - | - | 负责人 |
| createdAt | DATE | AUTO | NOW | 创建时间 |
| updatedAt | DATE | AUTO | NOW | 更新时间 |

### Products 商品表
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | 商品ID |
| name | STRING | NOT NULL | 商品名称 |
| brand | STRING | - | 品牌 |
| image | STRING | - | 商品图片 |
| specification | STRING | - | 规格 |
| code | STRING | UNIQUE | 商品编码 |
| unit | STRING | - | 单位 |
| description | TEXT | - | 描述 |
| stockAlertQuantity | INTEGER | - | 库存预警数量 |
| purchasePrice | FLOAT | NOT NULL | 采购价格 |
| retailPrice | FLOAT | - | 零售价格 |
| warehouse | STRING | - | 仓库 |
| createdBy | STRING | - | 创建人 |
| supplierId | INTEGER | FOREIGN KEY | 供应商ID |
| categoryId | INTEGER | FOREIGN KEY | 分类ID |
| createdAt | DATE | AUTO | 创建时间 |
| updatedAt | DATE | AUTO | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE (code)
- FOREIGN KEY (supplierId) REFERENCES Suppliers(id)
- FOREIGN KEY (categoryId) REFERENCES Categories(id)

---

## 库存管理

### Inventories 库存表
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | 库存ID |
| productId | INTEGER | FOREIGN KEY, NOT NULL | 商品ID |
| quantity | INTEGER | NOT NULL | 库存数量 |
| createdAt | DATE | AUTO | 创建时间 |
| updatedAt | DATE | AUTO | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- FOREIGN KEY (productId) REFERENCES Products(id)

### InventoryLogs 库存日志表
| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | 日志ID |
| inventoryId | INTEGER | FOREIGN KEY | - | 库存ID |
| changeQuantity | INTEGER | NOT NULL | - | 变动数量 |
| type | STRING | NOT NULL | - | 变动类型 |
| date | DATE | - | NOW | 变动日期 |
| relatedDocument | STRING | - | - | 相关单据 |
| operator | STRING | - | - | 操作员 |
| createdAt | DATE | AUTO | NOW | 创建时间 |
| updatedAt | DATE | AUTO | NOW | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- FOREIGN KEY (inventoryId) REFERENCES Inventories(id)

---

## 订单管理

### InboundOrders 入库单表
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | 入库单ID |
| order_no | STRING(50) | NOT NULL, UNIQUE | 入库单号 |
| type | ENUM | NOT NULL | 入库类型 |
| total_amount | DECIMAL(10,2) | - | 总金额 |
| total_quantity | INTEGER | - | 总数量 |
| order_date | DATE | NOT NULL | 入库日期 |
| operator | STRING(100) | NOT NULL | 操作员 |
| remark | STRING(500) | - | 备注 |
| **related_order_id** | INTEGER | - | **关联订单ID（盘盈入库关联盘点单ID，采购入库关联采购单ID）** |
| createdAt | DATE | AUTO | 创建时间 |
| updatedAt | DATE | AUTO | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE (order_no)
- INDEX (type)
- INDEX (order_date)
- **INDEX (related_order_id)**

### OutboundOrders 出库单表
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | 出库单ID |
| order_no | STRING(50) | NOT NULL, UNIQUE | 出库单号 |
| type | ENUM | NOT NULL | 出库类型 |
| total_amount | DECIMAL(10,2) | - | 总金额 |
| total_quantity | INTEGER | - | 总数量 |
| order_date | DATE | NOT NULL | 出库日期 |
| operator | STRING(100) | NOT NULL | 操作员 |
| remark | STRING(500) | - | 备注 |
| **related_order_id** | INTEGER | - | **关联订单ID（盘亏出库关联盘点单ID）** |
| createdAt | DATE | AUTO | 创建时间 |
| updatedAt | DATE | AUTO | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE (order_no)
- INDEX (type)
- INDEX (order_date)
- **INDEX (related_order_id)**

### OrderItems 订单项表
| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | 订单项ID |
| orderType | ENUM | NOT NULL | - | 订单类型：INBOUND/OUTBOUND |
| orderId | INTEGER | NOT NULL | - | 订单ID（入库单ID或出库单ID） |
| productId | INTEGER | NOT NULL | - | 商品ID |
| quantity | INTEGER | NOT NULL, >=1 | - | 数量 |
| unitPrice | DECIMAL(10,2) | - | 0.00 | 单价 |
| totalPrice | DECIMAL(10,2) | - | 0.00 | 总价 |
| unit | STRING(50) | - | - | 单位 |
| createdAt | DATE | AUTO | NOW | 创建时间 |
| updatedAt | DATE | AUTO | NOW | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- INDEX (orderType, orderId) - 复合索引
- INDEX (productId)
- INDEX (orderType)

---

## 盘点管理

### StocktakingOrders 盘点单表
| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | 盘点单ID |
| order_no | STRING(50) | NOT NULL, UNIQUE | - | 盘点单号 |
| stocktaking_date | DATE | NOT NULL | NOW | 盘点日期 |
| operator | STRING(100) | NOT NULL | - | 操作员 |
| remark | STRING(500) | - | - | 备注 |
| total_items | INTEGER | - | 0 | 盘点商品总数 |
| createdAt | DATE | AUTO | NOW | 创建时间 |
| updatedAt | DATE | AUTO | NOW | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE (order_no)
- INDEX (stocktaking_date)

### StocktakingItems 盘点项表
| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | 盘点项ID |
| stocktaking_order_id | INTEGER | NOT NULL, FOREIGN KEY | - | 盘点单ID |
| product_id | INTEGER | NOT NULL, FOREIGN KEY | - | 商品ID |
| product_name | STRING(200) | NOT NULL | - | 商品名称 |
| product_code | STRING(100) | NOT NULL | - | 商品编码 |
| specification | STRING(200) | - | - | 规格 |
| unit | STRING(50) | NOT NULL | - | 单位 |
| system_quantity | INTEGER | NOT NULL | 0 | 系统库存数量 |
| actual_quantity | INTEGER | - | - | 实际盘点数量 |
| createdAt | DATE | AUTO | NOW | 创建时间 |
| updatedAt | DATE | AUTO | NOW | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- INDEX (stocktaking_order_id)
- INDEX (product_id)
- UNIQUE (stocktaking_order_id, product_id) - 同一盘点单中不能重复添加同一商品
- FOREIGN KEY (stocktaking_order_id) REFERENCES StocktakingOrders(id)
- FOREIGN KEY (product_id) REFERENCES Products(id)

---

## 系统管理

### Messages 消息表
| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | 消息ID |
| content | STRING | NOT NULL | - | 消息内容 |
| type | ENUM | NOT NULL | - | 消息类型：INVENTORY_ALERT/STOCK_IN/STOCK_OUT |
| is_read | BOOLEAN | - | false | 是否已读 |
| user_id | INTEGER | NOT NULL | - | 用户ID（消息接收人） |
| related_id | STRING | - | - | 关联业务编号 |
| created_at | DATE | - | NOW | 创建时间 |
| updatedAt | DATE | AUTO | NOW | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- INDEX (is_read)
- INDEX (type)
- INDEX (created_at)
- INDEX (related_id)
- INDEX (user_id)

### Logs 日志表
| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | - | 日志ID |
| userId | INTEGER | - | - | 用户ID（系统操作可能为空） |
| username | STRING | - | - | 用户名 |
| actionType | STRING | NOT NULL | - | 操作类型 |
| module | STRING | NOT NULL | - | 模块 |
| details | TEXT | - | - | 详细信息 |
| ipAddress | STRING | - | - | IP地址 |
| createdAt | DATE | AUTO | NOW | 创建时间 |
| updatedAt | DATE | AUTO | NOW | 更新时间 |

---

## 模型关联关系

### 一对一关系
- **Product ↔ Inventory**: 一个商品对应一个库存记录

### 一对多关系
- **Category ↔ Product**: 一个分类下有多个商品
- **Supplier ↔ Product**: 一个供应商提供多个商品
- **Inventory ↔ InventoryLog**: 一个库存记录有多个变动日志
- **Product ↔ OrderItem**: 一个商品可以在多个订单项中
- **InboundOrder ↔ OrderItem**: 一个入库单有多个商品项
- **OutboundOrder ↔ OrderItem**: 一个出库单有多个商品项
- **StocktakingOrder ↔ StocktakingItem**: 一个盘点单有多个盘点项
- **Product ↔ StocktakingItem**: 一个商品可以被多次盘点

### 自关联关系
- **Category**: 支持父子分类层级结构

### 多态关联
- **OrderItem**: 通过 `orderType` 字段区分入库单项和出库单项，实现多态关联

### 枚举类型定义

#### 入库类型 (InboundType)
- `STOCK_IN`: 盘盈入库
- `PURCHASE`: 采购入库
- `RETURN`: 退货入库

#### 出库类型 (OutboundType)
- `STOCK_OUT`: 盘亏出库
- `SALE`: 销售出库

#### 订单项类型 (OrderItemType)
- `INBOUND`: 入库单明细
- `OUTBOUND`: 出库单明细

#### 消息类型 (MessageType)
- `INVENTORY_ALERT`: 库存预警
- `STOCK_IN`: 盘盈入库
- `STOCK_OUT`: 盘亏出库

#### 用户角色 (UserRole)
- `admin`: 管理员
- `manager`: 经理
- `operator`: 操作员

#### 用户状态 (UserStatus)
- `active`: 激活
- `inactive`: 未激活
- `suspended`: 暂停

---

## 数据库设计特点

### 1. 数据完整性
- 使用外键约束确保引用完整性
- 枚举类型限制数据取值范围
- 非空约束和唯一约束保证数据质量

### 2. 性能优化
- 合理设计索引提升查询性能
- 复合索引优化多字段查询
- 时间戳字段支持时间范围查询

### 3. 业务逻辑支持
- 多态关联支持订单项复用
- 自关联支持分类层级结构
- Hook机制实现业务规则

### 4. 扩展性设计
- 枚举类型易于扩展新值
- 模块化设计便于功能扩展
- 标准化命名规范

### 5. 审计追踪
- 创建和更新时间戳
- 操作日志记录
- 库存变动历史

---

**说明：**
1. 所有表都包含 `createdAt` 和 `updatedAt` 时间戳字段
2. 外键关联确保数据完整性
3. 索引设计优化查询性能
4. 枚举类型限制数据取值范围
5. 验证规则确保数据质量

这个WMS系统数据库设计支持完整的仓库管理功能，包括用户管理、商品管理、库存管理、入库出库、盘点以及系统日志等核心业务。

---

## 核心业务逻辑说明

### 1. 采购订单业务流程

#### 创建采购订单
1. **创建采购订单记录** → `purchase_orders` 表
2. **自动生成采购明细** → `purchase_order_items` 表
3. **状态设置为** `PENDING`（未确认）

#### 确认采购订单
1. **更新订单状态** → `CONFIRMED`（已确认）
2. **自动创建采购入库单** → `inbound_orders` 表，设置 `type = 'PURCHASE'`
3. **设置关联关系** → `inbound_orders.related_order_id = purchase_order.id`
4. **生成入库明细** → `order_items` 表，`orderType = 'INBOUND'`
5. **更新库存** → `inventories` 表增加库存数量
6. **创建库存流水** → `inventory_logs` 表记录变动

#### 删除采购订单
1. **检查关联入库单** → 查询 `inbound_orders` 表中 `related_order_id` 字段
2. **如存在关联入库单** → 禁止删除，返回错误信息
3. **如无关联关系** → 允许删除采购订单及其明细

### 2. 盘点单业务流程

#### 创建盘点单
1. **创建盘点单记录** → `stocktaking_orders` 表
2. **自动生成盘点明细** → `stocktaking_items` 表
3. **记录系统库存快照** → `system_quantity` 字段记录当前库存
4. **实际盘点数量** → `actual_quantity` 字段初始为空，待录入

#### 盘点结果处理
1. **录入实际盘点数量** → 更新 `actual_quantity` 字段
2. **计算盘盈盘亏** → `actual_quantity - system_quantity`
3. **盘盈处理**：
   - 创建盘盈入库单 → `inbound_orders` 表，`type = 'STOCK_IN'`
   - 设置关联关系 → `related_order_id = stocktaking_order.id`
   - 增加库存数量 → `inventories` 表
   - 创建库存流水 → `inventory_logs` 表
4. **盘亏处理**：
   - 创建盘亏出库单 → `outbound_orders` 表，`type = 'STOCK_OUT'`
   - 设置关联关系 → `related_order_id = stocktaking_order.id`
   - 减少库存数量 → `inventories` 表
   - 创建库存流水 → `inventory_logs` 表

#### 删除盘点单
1. **检查关联出入库单** → 查询相关表中的 `related_order_id` 字段
2. **如存在关联单据** → 禁止删除，返回错误信息
3. **如无关联关系** → 允许删除盘点单及其明细

### 3. 入库单业务流程

#### 创建入库单
1. **创建入库单记录** → `inbound_orders` 表
2. **生成订单明细** → `order_items` 表，`orderType = 'INBOUND'`
3. **更新库存数量** → `inventories` 表增加对应数量
4. **创建库存流水** → `inventory_logs` 表记录入库操作

#### 删除入库单
1. **删除订单明细** → `order_items` 表
2. **回退库存数量** → `inventories` 表减少对应数量
3. **删除库存流水** → `inventory_logs` 表删除相关记录
4. **删除入库单** → `inbound_orders` 表

### 4. 出库单业务流程

#### 创建出库单
1. **创建出库单记录** → `outbound_orders` 表
2. **生成订单明细** → `order_items` 表，`orderType = 'OUTBOUND'`
3. **更新库存数量** → `inventories` 表减少对应数量
4. **创建库存流水** → `inventory_logs` 表记录出库操作

#### 删除出库单
1. **删除订单明细** → `order_items` 表
2. **恢复库存数量** → `inventories` 表增加对应数量
3. **删除库存流水** → `inventory_logs` 表删除相关记录
4. **删除出库单** → `outbound_orders` 表

### 5. 关联关系管理

#### 入库单关联来源
- **采购入库** → `related_order_id` 关联采购订单ID
- **盘盈入库** → `related_order_id` 关联盘点单ID
- **手动入库** → `related_order_id` 为空

#### 出库单关联来源
- **盘亏出库** → `related_order_id` 关联盘点单ID
- **手动出库** → `related_order_id` 为空

#### 前端显示逻辑
- 根据 `related_order_id` 和 `type` 字段判断关联来源
- 显示相应的关联来源标签（采购单、盘点单、手动创建）

### 6. 数据一致性保证

#### 删除保护机制
- 采购订单：检查关联入库单
- 盘点单：检查关联出入库单
- 商品：检查库存记录和订单明细
- 供应商：检查关联商品和采购订单

#### 事务处理
- 所有涉及多表操作的业务都使用数据库事务
- 确保操作的原子性和一致性
- 失败时自动回滚所有相关操作

#### 库存同步
- 所有库存变动都通过统一的库存服务处理
- 确保库存数量的准确性和一致性
- 实时更新库存流水记录

---

## 业务规则总结

1. **采购单逻辑**：新建采购单→创建采购明细；采购单确认后→创建采购入库单；采购单删除前检查关联入库单，如有则不允许删除

2. **盘点单逻辑**：新建盘点单→创建盘点明细；盘盈→创建盘盈入库单；盘亏→创建盘亏出库单；盘点单删除前检查关联出入库单，如有则不允许删除

3. **入库单逻辑**：新建入库单→创建明细→更新库存→创建库存流水；删除入库单→删除明细→回退库存→删除库存流水

4. **出库单逻辑**：新建出库单→创建明细→更新库存→创建库存流水；删除出库单→删除明细→恢复库存→删除库存流水

这些业务规则确保了系统数据的完整性和一致性，为仓库管理提供了可靠的数据基础。 