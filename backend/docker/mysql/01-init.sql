-- 设置字符集，防止中文乱码
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET character_set_connection=utf8mb4;

-- WMS 仓库管理系统数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS wms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wms_db;

-- 删除已存在的表（按依赖关系逆序删除）
DROP TABLE IF EXISTS `logs`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `inventory_logs`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `stocktaking_items`;
DROP TABLE IF EXISTS `stocktaking_orders`;
DROP TABLE IF EXISTS `outbound_orders`;
DROP TABLE IF EXISTS `inbound_orders`;
DROP TABLE IF EXISTS `inventories`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `users`;

-- 1. 用户表
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `fullname` varchar(255) NOT NULL,
  `role` enum('admin','manager','operator') NOT NULL DEFAULT 'operator',
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `phone` varchar(255) DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 供应商表
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `credit_rating` int DEFAULT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `manager` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 分类表
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `parent_id` int DEFAULT NULL,
  `level` int NOT NULL,
  `sort` int DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 商品表
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `specification` varchar(255) DEFAULT NULL,
  `code` varchar(255) DEFAULT NULL,
  `unit` varchar(255) DEFAULT NULL,
  `description` text,
  `stock_alert_quantity` int DEFAULT NULL,
  `purchase_price` float NOT NULL,
  `retail_price` float DEFAULT NULL,
  `warehouse` varchar(255) DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `supplier_id` int DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `supplier_id` (`supplier_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 库存表
CREATE TABLE `inventories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `inventories_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 入库订单表
CREATE TABLE `inbound_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_no` varchar(50) NOT NULL COMMENT '入库单号',
  `type` enum('STOCK_IN','PURCHASE','RETURN') NOT NULL COMMENT '入库类型',
  `total_amount` decimal(10,2) DEFAULT 0.00 COMMENT '总金额',
  `total_quantity` int DEFAULT 0 COMMENT '总数量',
  `order_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入库日期',
  `operator` varchar(100) NOT NULL COMMENT '操作员',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `type` (`type`),
  KEY `order_date` (`order_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 出库订单表
CREATE TABLE `outbound_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_no` varchar(50) NOT NULL COMMENT '出库单号',
  `type` enum('STOCK_OUT','SALE','TRANSFER_OUT','SCRAP') NOT NULL COMMENT '出库类型',
  `total_amount` decimal(10,2) DEFAULT 0.00 COMMENT '总金额',
  `total_quantity` int DEFAULT 0 COMMENT '总数量',
  `order_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '出库日期',
  `operator` varchar(100) NOT NULL COMMENT '操作员',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `type` (`type`),
  KEY `order_date` (`order_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 盘点订单表
CREATE TABLE `stocktaking_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_no` varchar(50) NOT NULL COMMENT '盘点单号',
  `stocktaking_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '盘点日期',
  `operator` varchar(100) NOT NULL COMMENT '操作员',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `total_items` int DEFAULT 0 COMMENT '盘点商品总数',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `stocktaking_date` (`stocktaking_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 订单项表（通用）
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_type` enum('INBOUND','OUTBOUND') NOT NULL COMMENT '订单类型：INBOUND-入库单，OUTBOUND-出库单',
  `order_id` int NOT NULL COMMENT '订单ID（入库单ID或出库单ID）',
  `product_id` int NOT NULL COMMENT '商品ID',
  `quantity` int NOT NULL COMMENT '数量',
  `unit_price` decimal(10,2) DEFAULT 0.00 COMMENT '单价',
  `total_price` decimal(10,2) DEFAULT 0.00 COMMENT '总价',
  `unit` varchar(50) DEFAULT NULL COMMENT '单位',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`order_type`,`order_id`),
  KEY `product_id` (`product_id`),
  KEY `order_type` (`order_type`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. 盘点项表
CREATE TABLE `stocktaking_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stocktaking_order_id` int NOT NULL COMMENT '盘点单ID',
  `product_id` int NOT NULL COMMENT '商品ID',
  `product_name` varchar(200) NOT NULL COMMENT '商品名称',
  `product_code` varchar(100) NOT NULL COMMENT '商品编码',
  `specification` varchar(200) DEFAULT NULL COMMENT '规格',
  `unit` varchar(50) NOT NULL COMMENT '单位',
  `system_quantity` int NOT NULL DEFAULT 0 COMMENT '系统库存数量',
  `actual_quantity` int DEFAULT NULL COMMENT '实际盘点数量',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stocktaking_order_product` (`stocktaking_order_id`,`product_id`),
  KEY `stocktaking_order_id` (`stocktaking_order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `stocktaking_items_ibfk_1` FOREIGN KEY (`stocktaking_order_id`) REFERENCES `stocktaking_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `stocktaking_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. 库存日志表
CREATE TABLE `inventory_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `inventory_id` int DEFAULT NULL,
  `change_quantity` int NOT NULL,
  `type` varchar(255) NOT NULL,
  `date` datetime DEFAULT CURRENT_TIMESTAMP,
  `related_document` varchar(255) DEFAULT NULL,
  `operator` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `inventory_id` (`inventory_id`),
  CONSTRAINT `inventory_logs_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `inventories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. 消息表
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `content` varchar(255) NOT NULL COMMENT '消息内容',
  `type` enum('INVENTORY_ALERT','STOCK_IN','STOCK_OUT') NOT NULL COMMENT '消息类型',
  `is_read` tinyint(1) DEFAULT 0 COMMENT '是否已读',
  `user_id` int NOT NULL COMMENT '用户ID（消息接收人）',
  `related_id` varchar(255) DEFAULT NULL COMMENT '关联业务编号',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `is_read` (`is_read`),
  KEY `type` (`type`),
  KEY `created_at` (`created_at`),
  KEY `related_id` (`related_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. 日志表
CREATE TABLE `logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL COMMENT '系统操作可能没有userId',
  `username` varchar(255) DEFAULT NULL COMMENT '对应userId为空的情况',
  `action_type` varchar(255) NOT NULL,
  `module` varchar(255) NOT NULL,
  `details` text,
  `ip_address` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入初始数据（测试中文字符集）

-- 插入默认用户，密码：123456
INSERT INTO `users` (`username`, `password`, `email`, `fullname`, `role`, `status`) VALUES
('admin', '$2b$10$0wHElJAGLH1TqEMjDcFhF.Jc9u7vNkwZ7EYdT/FWW/4punOf8xlB.', 'admin@wms.com', '系统管理员', 'admin', 'active'),
('manager', '$2b$10$0wHElJAGLH1TqEMjDcFhF.Jc9u7vNkwZ7EYdT/FWW/4punOf8xlB.', 'manager@wms.com', '仓库经理', 'manager', 'active'),
('operator', '$2b$10$0wHElJAGLH1TqEMjDcFhF.Jc9u7vNkwZ7EYdT/FWW/4punOf8xlB.', 'operator@wms.com', '操作员', 'operator', 'active');

-- 插入默认供应商
INSERT INTO `suppliers` (`name`, `contact_person`, `address`, `email`, `phone`, `credit_rating`, `payment_method`, `manager`) VALUES
('默认供应商', '张三', '北京市朝阳区', 'supplier1@example.com', '13800138001', 5, '月结30天', '李四'),
('科技供应商', '王五', '上海市浦东新区', 'supplier2@example.com', '13800138002', 4, '现金', '赵六');

-- 插入默认分类
INSERT INTO `categories` (`name`, `parent_id`, `level`, `sort`) VALUES
('电子产品', NULL, 1, 1),
('办公用品', NULL, 1, 2),
('手机', 1, 2, 1),
('电脑', 1, 2, 2),
('文具', 2, 2, 1),
('纸张', 2, 2, 2);

-- 插入示例商品
INSERT INTO `products` (`name`, `brand`, `specification`, `code`, `unit`, `description`, `stock_alert_quantity`, `purchase_price`, `retail_price`, `warehouse`, `created_by`, `supplier_id`, `category_id`) VALUES
('iPhone 15', 'Apple', '128GB 黑色', 'IP15-128-BK', '台', 'Apple iPhone 15 智能手机', 10, 5999.00, 6999.00, '主仓库', 'admin', 1, 3),
('MacBook Pro', 'Apple', '13寸 M2芯片', 'MBP-13-M2', '台', 'Apple MacBook Pro 笔记本电脑', 5, 9999.00, 12999.00, '主仓库', 'admin', 1, 4),
('圆珠笔', '晨光', '0.5mm 蓝色', 'CG-BP-05-BL', '支', '晨光圆珠笔', 100, 1.50, 2.00, '主仓库', 'admin', 2, 5),
('A4复印纸', '得力', '70g 500张/包', 'DL-A4-70G', '包', '得力A4复印纸', 50, 15.00, 20.00, '主仓库', 'admin', 2, 6);

-- 插入初始库存
INSERT INTO `inventories` (`product_id`, `quantity`) VALUES
(1, 50),
(2, 20),
(3, 500),
(4, 100);

-- 插入示例消息
INSERT INTO `messages` (`content`, `type`, `is_read`, `user_id`, `related_id`) VALUES
('商品 iPhone 15 库存不足，当前库存：50，预警数量：10', 'INVENTORY_ALERT', 0, 1, 'IP15-128-BK'),
('商品 MacBook Pro 库存不足，当前库存：20，预警数量：5', 'INVENTORY_ALERT', 0, 1, 'MBP-13-M2');

-- 插入示例日志
INSERT INTO `logs` (`user_id`, `username`, `action_type`, `module`, `details`, `ip_address`) VALUES
(1, 'admin', 'LOGIN', 'AUTH', '管理员登录系统', '127.0.0.1'),
(1, 'admin', 'CREATE', 'PRODUCT', '创建商品：iPhone 15', '127.0.0.1'),
(1, 'admin', 'CREATE', 'PRODUCT', '创建商品：MacBook Pro', '127.0.0.1');