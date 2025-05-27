// 角色定义
const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  OPERATOR: 'operator'
};

// 需要特殊权限控制的操作
const RESTRICTED_OPERATIONS = {
  // 商品管理：operator只能查看，不能增删改
  PRODUCT_WRITE: 'product_write', // 商品的增删改操作
  
  // 供应商管理：只有admin和manager可以访问
  SUPPLIER_ACCESS: 'supplier_access', // 供应商的所有操作
  
  // 系统管理：只有admin可以访问
  SYSTEM_ADMIN: 'system_admin' // 用户管理、日志管理等
};

// 角色权限映射 - 只定义有权限的角色
const ROLE_PERMISSIONS = {
  [RESTRICTED_OPERATIONS.PRODUCT_WRITE]: [ROLES.ADMIN, ROLES.MANAGER], // operator不能修改商品
  [RESTRICTED_OPERATIONS.SUPPLIER_ACCESS]: [ROLES.ADMIN, ROLES.MANAGER], // operator不能访问供应商
  [RESTRICTED_OPERATIONS.SYSTEM_ADMIN]: [ROLES.ADMIN] // 只有admin能访问系统管理
};

// 检查用户是否有指定操作权限
const hasPermission = (userRole, operation) => {
  const allowedRoles = ROLE_PERMISSIONS[operation];
  return allowedRoles && allowedRoles.includes(userRole);
};

// 检查是否为管理员角色（admin或manager）
const isManager = (userRole) => {
  return userRole === ROLES.ADMIN || userRole === ROLES.MANAGER;
};

// 检查是否为超级管理员
const isAdmin = (userRole) => {
  return userRole === ROLES.ADMIN;
};

module.exports = {
  ROLES,
  RESTRICTED_OPERATIONS,
  hasPermission,
  isManager,
  isAdmin
}; 