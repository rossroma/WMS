-- 设置连接字符集，防止插入中文乱码
SET NAMES utf8mb4;

-- 创建数据库
CREATE DATABASE IF NOT EXISTS wms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE wms_db;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    fullname VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    phone VARCHAR(50),
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建角色表
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255),
    permissions JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建用户角色关联表
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 创建供应商表
CREATE TABLE IF NOT EXISTS suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    address VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    credit_rating INT,
    payment_method VARCHAR(50),
    manager VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建分类表
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    parent_category_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES categories(id)
);

-- 创建产品表
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    image VARCHAR(255),
    specification VARCHAR(255),
    code VARCHAR(255) UNIQUE,
    unit VARCHAR(50),
    description TEXT,
    stock_alert_quantity INT,
    purchase_price FLOAT NOT NULL,
    retail_price FLOAT,
    warehouse VARCHAR(255),
    created_by VARCHAR(255),
    supplier_id INT,
    category_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 创建库存表
CREATE TABLE IF NOT EXISTS inventories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 创建入库单表
CREATE TABLE IF NOT EXISTS inbound_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(50) NOT NULL UNIQUE COMMENT '入库单号',
    type ENUM('STOCK_IN', 'PURCHASE', 'RETURN', 'TRANSFER_IN') NOT NULL COMMENT '入库类型',
    total_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT '总金额',
    total_quantity INT DEFAULT 0 COMMENT '总数量',
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入库日期',
    operator VARCHAR(100) NOT NULL COMMENT '操作员',
    remark VARCHAR(500) COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建出库单表
CREATE TABLE IF NOT EXISTS outbound_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(50) NOT NULL UNIQUE COMMENT '出库单号',
    type ENUM('STOCK_OUT', 'SALE', 'TRANSFER_OUT', 'SCRAP') NOT NULL COMMENT '出库类型',
    total_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT '总金额',
    total_quantity INT DEFAULT 0 COMMENT '总数量',
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '出库日期',
    operator VARCHAR(100) NOT NULL COMMENT '操作员',
    remark VARCHAR(500) COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建通用订单商品明细表（支持入库单和出库单）
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_type ENUM('INBOUND', 'OUTBOUND') NOT NULL COMMENT '订单类型：INBOUND-入库单，OUTBOUND-出库单',
    order_id INT NOT NULL COMMENT '订单ID（入库单ID或出库单ID）',
    product_id INT NOT NULL COMMENT '商品ID',
    quantity INT NOT NULL COMMENT '数量',
    unit_price DECIMAL(10, 2) DEFAULT 0.00 COMMENT '单价',
    total_price DECIMAL(10, 2) DEFAULT 0.00 COMMENT '总价',
    unit VARCHAR(50) COMMENT '单位',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order_items_order (order_type, order_id),
    INDEX idx_order_items_product (product_id),
    INDEX idx_order_items_type (order_type)
);

-- 创建盘点单表
CREATE TABLE IF NOT EXISTS stocktaking_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(50) NOT NULL UNIQUE COMMENT '盘点单号',
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    product_id INT NOT NULL,
    actual_quantity INT NOT NULL,
    recorded_quantity INT NOT NULL,
    remark VARCHAR(255),
    operator VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 创建库存日志表
CREATE TABLE IF NOT EXISTS inventory_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inventory_id INT NOT NULL,
    change_quantity INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    related_document VARCHAR(255),
    operator VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventories(id)
);

-- 创建消息表
CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content VARCHAR(255) NOT NULL COMMENT '消息内容',
    type ENUM('INVENTORY_ALERT', 'STOCK_IN', 'STOCK_OUT') NOT NULL COMMENT '消息类型',
    is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
    user_id INT NOT NULL COMMENT '用户ID（消息接收人）',
    related_id VARCHAR(50) COMMENT '关联业务编号',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_messages_is_read (is_read),
    INDEX idx_messages_type (type),
    INDEX idx_messages_created_at (created_at),
    INDEX idx_messages_related_id (related_id),
    INDEX idx_messages_user_id (user_id)
);

-- 创建索引
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_inventories_product ON inventories(product_id);
CREATE INDEX idx_inbound_orders_order_no ON inbound_orders(order_no);
CREATE INDEX idx_inbound_orders_type ON inbound_orders(type);
CREATE INDEX idx_inbound_orders_date ON inbound_orders(order_date);
CREATE INDEX idx_outbound_orders_order_no ON outbound_orders(order_no);
CREATE INDEX idx_outbound_orders_type ON outbound_orders(type);
CREATE INDEX idx_outbound_orders_date ON outbound_orders(order_date);
CREATE INDEX idx_stocktaking_orders_order_no ON stocktaking_orders(order_no);
CREATE INDEX idx_stocktaking_orders_product ON stocktaking_orders(product_id);
CREATE INDEX idx_inventory_logs_inventory ON inventory_logs(inventory_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- 插入默认角色
INSERT INTO roles (name, description) VALUES
('admin', '系统管理员'),
('manager', '仓库管理员'),
('operator', '操作员');

-- 插入默认管理员用户（密码：123456）
INSERT INTO users (username, password, email, fullname, status) VALUES
('admin', '$2b$10$bIbrq4cwgzTlM4bS7I26ee.WeJ9SJVqc9r28WV8pWBBjSDxEKuu1i', 'admin@example.com', '系统管理员', 'active');

-- 为管理员用户分配角色
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1);