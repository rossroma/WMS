-- WMS仓库管理系统数据库初始化脚本
-- 基于最新的模型文件生成

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `wms_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `wms_db`;

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET character_set_connection=utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ======================================
-- 1. 用户表 (Users)
-- ======================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(255) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码',
  `email` varchar(255) NOT NULL COMMENT '邮箱',
  `fullname` varchar(255) NOT NULL COMMENT '全名',
  `role` enum('admin','manager','operator') NOT NULL DEFAULT 'operator' COMMENT '角色',
  `status` enum('active','inactive','suspended') DEFAULT 'active' COMMENT '状态',
  `phone` varchar(255) DEFAULT NULL COMMENT '电话',
  `last_login_at` datetime DEFAULT NULL COMMENT '最后登录时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户表';

-- ======================================
-- 2. 分类表 (Categories)
-- ======================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` varchar(255) NOT NULL COMMENT '分类名称',
  `parent_id` int DEFAULT NULL COMMENT '父分类ID',
  `level` int NOT NULL COMMENT '分类层级',
  `sort` int DEFAULT '0' COMMENT '排序',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='商品分类表';

-- ======================================
-- 3. 供应商表 (Suppliers)
-- ======================================
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '供应商ID',
  `name` varchar(255) NOT NULL COMMENT '供应商名称',
  `contact_person` varchar(255) DEFAULT NULL COMMENT '联系人',
  `address` varchar(255) DEFAULT NULL COMMENT '地址',
  `email` varchar(255) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(255) DEFAULT NULL COMMENT '电话',
  `credit_rating` int DEFAULT NULL COMMENT '信用等级',
  `payment_method` varchar(255) DEFAULT NULL COMMENT '付款方式',
  `manager` varchar(255) DEFAULT NULL COMMENT '负责人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='供应商表';

-- ======================================
-- 4. 商品表 (Products)
-- ======================================
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '商品ID',
  `name` varchar(255) NOT NULL COMMENT '商品名称',
  `brand` varchar(255) DEFAULT NULL COMMENT '品牌',
  `image` varchar(255) DEFAULT NULL COMMENT '商品图片',
  `specification` varchar(255) DEFAULT NULL COMMENT '规格',
  `code` varchar(255) DEFAULT NULL COMMENT '商品编码',
  `unit` varchar(255) DEFAULT NULL COMMENT '单位',
  `description` text COMMENT '描述',
  `stock_alert_quantity` int DEFAULT NULL COMMENT '库存预警数量',
  `purchase_price` float NOT NULL COMMENT '采购价格',
  `retail_price` float DEFAULT NULL COMMENT '零售价格',
  `warehouse` varchar(255) DEFAULT NULL COMMENT '仓库位置',
  `created_by` varchar(255) DEFAULT NULL COMMENT '创建者',
  `supplier_id` int DEFAULT NULL COMMENT '供应商ID',
  `category_id` int DEFAULT NULL COMMENT '分类ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `supplier_id` (`supplier_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='商品表';

-- ======================================
-- 5. 库存表 (Inventories)
-- ======================================
DROP TABLE IF EXISTS `inventories`;
CREATE TABLE `inventories` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '库存ID',
  `product_id` int NOT NULL COMMENT '商品ID',
  `quantity` int NOT NULL DEFAULT '0' COMMENT '库存数量',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_id` (`product_id`),
  CONSTRAINT `inventories_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='库存表';

-- ======================================
-- 6. 采购单表 (Purchase Orders)
-- ======================================
DROP TABLE IF EXISTS `purchase_orders`;
CREATE TABLE `purchase_orders` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '采购单ID',
  `order_no` varchar(50) NOT NULL COMMENT '采购单号',
  `supplier_id` int NOT NULL COMMENT '供应商ID',
  `order_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '订单日期',
  `expected_arrival_date` datetime DEFAULT NULL COMMENT '预计到货日期',
  `status` enum('PENDING','CONFIRMED') NOT NULL DEFAULT 'PENDING' COMMENT '状态',
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '总金额',
  `total_quantity` int NOT NULL DEFAULT '0' COMMENT '总数量',
  `payment_method` varchar(50) DEFAULT NULL COMMENT '付款方式',
  `operator` varchar(100) NOT NULL COMMENT '操作员',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `supplier_id` (`supplier_id`),
  KEY `status` (`status`),
  KEY `order_date` (`order_date`),
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='采购单表';

-- ======================================
-- 7. 采购单明细表 (Purchase Order Items)
-- ======================================
DROP TABLE IF EXISTS `purchase_order_items`;
CREATE TABLE `purchase_order_items` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '采购单明细ID',
  `purchase_order_id` int NOT NULL COMMENT '采购单ID',
  `product_id` int NOT NULL COMMENT '商品ID',
  `quantity` int NOT NULL COMMENT '数量',
  `unit_price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '单价',
  `total_price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '总价',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_order_id_product_id` (`purchase_order_id`,`product_id`),
  KEY `purchase_order_id` (`purchase_order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `purchase_order_items_ibfk_1` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `purchase_order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='采购单明细表';

-- ======================================
-- 8. 入库单表 (Inbound Orders)
-- ======================================
DROP TABLE IF EXISTS `inbound_orders`;
CREATE TABLE `inbound_orders` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '入库单ID',
  `order_no` varchar(50) NOT NULL COMMENT '入库单号',
  `type` enum('STOCK_IN','PURCHASE','RETURN') NOT NULL COMMENT '入库类型',
  `total_amount` decimal(10,2) DEFAULT '0.00' COMMENT '总金额',
  `total_quantity` int DEFAULT '0' COMMENT '总数量',
  `order_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入库日期',
  `operator` varchar(100) NOT NULL COMMENT '操作员',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `related_order_id` int DEFAULT NULL COMMENT '关联订单ID（盘盈入库关联盘点单ID，采购入库关联采购单ID）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `type` (`type`),
  KEY `order_date` (`order_date`),
  KEY `idx_inbound_orders_related_order_id` (`related_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='入库单表';

-- ======================================
-- 9. 出库单表 (Outbound Orders)
-- ======================================
DROP TABLE IF EXISTS `outbound_orders`;
CREATE TABLE `outbound_orders` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '出库单ID',
  `order_no` varchar(50) NOT NULL COMMENT '出库单号',
  `type` enum('STOCK_OUT','SALE') NOT NULL COMMENT '出库类型',
  `total_amount` decimal(10,2) DEFAULT '0.00' COMMENT '总金额',
  `total_quantity` int DEFAULT '0' COMMENT '总数量',
  `order_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '出库日期',
  `operator` varchar(100) NOT NULL COMMENT '操作员',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `related_order_id` int DEFAULT NULL COMMENT '关联订单ID（盘亏出库关联盘点单ID）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `type` (`type`),
  KEY `order_date` (`order_date`),
  KEY `idx_outbound_orders_related_order_id` (`related_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='出库单表';

-- ======================================
-- 10. 订单明细表 (Order Items) - 多态关联
-- ======================================
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '订单明细ID',
  `order_type` enum('INBOUND','OUTBOUND') NOT NULL COMMENT '订单类型：INBOUND-入库单，OUTBOUND-出库单',
  `order_id` int NOT NULL COMMENT '订单ID（入库单ID或出库单ID）',
  `product_id` int NOT NULL COMMENT '商品ID',
  `quantity` int NOT NULL COMMENT '数量',
  `unit_price` decimal(10,2) DEFAULT '0.00' COMMENT '单价',
  `total_price` decimal(10,2) DEFAULT '0.00' COMMENT '总价',
  `unit` varchar(50) DEFAULT NULL COMMENT '单位',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`order_type`,`order_id`),
  KEY `product_id` (`product_id`),
  KEY `order_type` (`order_type`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='订单明细表';

-- ======================================
-- 11. 盘点单表 (Stocktaking Orders)
-- ======================================
DROP TABLE IF EXISTS `stocktaking_orders`;
CREATE TABLE `stocktaking_orders` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '盘点单ID',
  `order_no` varchar(50) NOT NULL COMMENT '盘点单号',
  `stocktaking_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '盘点日期',
  `operator` varchar(100) NOT NULL COMMENT '操作员',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `total_items` int DEFAULT '0' COMMENT '盘点商品总数',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `stocktaking_date` (`stocktaking_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='盘点单表';

-- ======================================
-- 12. 盘点商品明细表 (Stocktaking Items)
-- ======================================
DROP TABLE IF EXISTS `stocktaking_items`;
CREATE TABLE `stocktaking_items` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '盘点明细ID',
  `stocktaking_order_id` int NOT NULL COMMENT '盘点单ID',
  `product_id` int NOT NULL COMMENT '商品ID',
  `product_name` varchar(200) NOT NULL COMMENT '商品名称',
  `product_code` varchar(100) NOT NULL COMMENT '商品编码',
  `specification` varchar(200) DEFAULT NULL COMMENT '规格',
  `unit` varchar(50) NOT NULL COMMENT '单位',
  `system_quantity` int NOT NULL DEFAULT '0' COMMENT '系统库存数量',
  `actual_quantity` int DEFAULT NULL COMMENT '实际盘点数量',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `stocktaking_order_id_product_id` (`stocktaking_order_id`,`product_id`),
  KEY `stocktaking_order_id` (`stocktaking_order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `stocktaking_items_ibfk_1` FOREIGN KEY (`stocktaking_order_id`) REFERENCES `stocktaking_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `stocktaking_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='盘点商品明细表';

-- ======================================
-- 13. 库存流水表 (Inventory Logs)
-- ======================================
DROP TABLE IF EXISTS `inventory_logs`;
CREATE TABLE `inventory_logs` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '库存流水ID',
  `order_item_id` int NOT NULL COMMENT '订单明细ID',
  `change_quantity` int NOT NULL COMMENT '库存变化数量',
  `type` varchar(255) NOT NULL COMMENT '操作类型：入库、出库、盘点等',
  `date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '操作日期',
  `related_document` varchar(255) DEFAULT NULL COMMENT '相关单据号',
  `operator` varchar(255) DEFAULT NULL COMMENT '操作员',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `order_item_id` (`order_item_id`),
  CONSTRAINT `inventory_logs_ibfk_1` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='库存流水表';

-- ======================================
-- 14. 消息表 (Messages)
-- ======================================
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `content` varchar(255) NOT NULL COMMENT '消息内容',
  `type` enum('INVENTORY_ALERT','STOCK_IN','STOCK_OUT') NOT NULL COMMENT '消息类型',
  `is_read` tinyint(1) DEFAULT '0' COMMENT '是否已读',
  `user_id` int NOT NULL COMMENT '用户ID（消息接收人）',
  `related_id` varchar(255) DEFAULT NULL COMMENT '关联业务编号',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `is_read` (`is_read`),
  KEY `type` (`type`),
  KEY `created_at` (`created_at`),
  KEY `related_id` (`related_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='消息表';

-- ======================================
-- 15. 日志表 (Logs)
-- ======================================
DROP TABLE IF EXISTS `logs`;
CREATE TABLE `logs` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_id` int DEFAULT NULL COMMENT '用户ID',
  `username` varchar(255) DEFAULT NULL COMMENT '用户名',
  `action_type` varchar(255) NOT NULL COMMENT '操作类型',
  `module` varchar(255) NOT NULL COMMENT '模块',
  `details` text COMMENT '详细信息',
  `ip_address` varchar(255) DEFAULT NULL COMMENT 'IP地址',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `action_type` (`action_type`),
  KEY `module` (`module`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='系统日志表';

-- ======================================
-- 初始数据插入
-- ======================================

-- 插入默认用户，密码：123456
INSERT INTO `users` (`username`, `password`, `email`, `fullname`, `role`, `status`) VALUES
('admin', '$2b$10$0wHElJAGLH1TqEMjDcFhF.Jc9u7vNkwZ7EYdT/FWW/4punOf8xlB.', 'admin@wms.com', '系统管理员', 'admin', 'active'),
('manager', '$2b$10$0wHElJAGLH1TqEMjDcFhF.Jc9u7vNkwZ7EYdT/FWW/4punOf8xlB.', 'manager@wms.com', '仓库经理', 'manager', 'active'),
('operator', '$2b$10$0wHElJAGLH1TqEMjDcFhF.Jc9u7vNkwZ7EYdT/FWW/4punOf8xlB.', 'operator@wms.com', '操作员', 'operator', 'active');

-- 插入默认商品分类
INSERT INTO `categories` (`name`, `parent_id`, `level`, `sort`) VALUES
('电子产品', NULL, 1, 1),
('手机', 1, 2, 1),
('电脑', 1, 2, 2),
('配件', 1, 2, 3),
('服装', NULL, 1, 2),
('男装', 5, 2, 1),
('女装', 5, 2, 2),
('童装', 5, 2, 3),
('食品', NULL, 1, 3),
('零食', 9, 2, 1),
('饮料', 9, 2, 2),
('生鲜', 9, 2, 3);

-- 插入默认供应商
INSERT INTO `suppliers` (`name`, `contact_person`, `address`, `email`, `phone`, `credit_rating`, `payment_method`, `manager`) VALUES
('华为技术有限公司', '张三', '深圳市龙岗区华为基地', 'zhangsan@huawei.com', '0755-12345678', 5, 'BANK_TRANSFER', '李四'),
('小米科技有限公司', '王五', '北京市海淀区小米科技园', 'wangwu@xiaomi.com', '010-87654321', 4, 'BANK_TRANSFER', '赵六'),
('苹果公司', 'John Smith', '美国加利福尼亚州库比蒂诺', 'john@apple.com', '+1-408-996-1010', 5, 'BANK_TRANSFER', '李明');

-- 插入示例商品
INSERT INTO `products` (`name`, `brand`, `specification`, `code`, `unit`, `description`, `stock_alert_quantity`, `purchase_price`, `retail_price`, `warehouse`, `created_by`, `supplier_id`, `category_id`) VALUES
('华为P60 Pro', '华为', '8GB+256GB 星钻银', 'HWP60P256S', '台', '华为旗舰手机，搭载骁龙8+处理器', 10, 4999.00, 6999.00, 'A区-01-01', 'admin', 1, 2),
('小米13 Ultra', '小米', '12GB+512GB 黑色', 'MI13U512B', '台', '小米影像旗舰，徕卡专业光学镜头', 5, 4499.00, 5999.00, 'A区-01-02', 'admin', 2, 2),
('MacBook Pro 14寸', '苹果', 'M2 Pro 16GB+512GB', 'MBPM214512', '台', '苹果专业笔记本电脑', 3, 12999.00, 15999.00, 'A区-02-01', 'admin', 3, 3),
('iPhone 15 Pro', '苹果', '256GB 深空黑色', 'IP15P256B', '台', '苹果最新旗舰手机', 8, 7999.00, 9999.00, 'A区-01-03', 'admin', 3, 2);

-- 插入初始库存
INSERT INTO `inventories` (`product_id`, `quantity`) VALUES
(1, 50),
(2, 30),
(3, 15),
(4, 25);

SET FOREIGN_KEY_CHECKS = 1;