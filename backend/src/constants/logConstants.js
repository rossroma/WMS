// 日志模块常量

// 操作模块
const LOG_MODULE = {
  USER: '用户管理',
  ROLE: '角色管理',
  MENU: '菜单管理',
  LOG: '日志管理',
  SUPPLIER: '供应商管理',
  CUSTOMER: '客户管理',
  PRODUCT: '产品管理',
  WAREHOUSE: '仓库管理',
  STOCK_IN: '入库管理',
  STOCK_OUT: '出库管理',
  INVENTORY: '库存管理',
  SYSTEM: '系统设置',
  AUTH: '认证授权',
  // 可根据实际业务模块继续添加
};

// 操作类型
const LOG_ACTION_TYPE = {
  CREATE: '新增',
  UPDATE: '修改',
  DELETE: '删除',
  LOGIN: '登录',
  LOGOUT: '登出',
  QUERY: '查询',
  EXPORT: '导出',
  IMPORT: '导入',
  ASSIGN: '分配', // 例如分配角色
  CHANGE_PASSWORD: '修改密码',
  UPLOAD: '上传文件',
  DOWNLOAD: '下载文件',
  ENABLE: '启用',
  DISABLE: '禁用',
  // 可根据实际操作类型继续添加
};

// 通用操作详情，具体业务操作的详情可以在调用时自定义或进一步细化
// 这里可以预定义一些非常通用的详情，或者作为示例
const LOG_DETAILS = {
  // 登录成功/失败可以由服务端记录更准确的userId和ip，前端主要记录尝试行为
  LOGIN_SUCCESS: '登录成功',
  LOGIN_FAILURE: '登录失败',
  PASSWORD_RESET_REQUEST: '请求重置密码',
  PASSWORD_RESET_SUCCESS: '密码重置成功',
  // 更多通用详情...
};

// 如果某些模块有非常固定的操作详情组合，也可以在这里定义
// 例如：
// const USER_LOG_DETAILS = {
//   CREATE_SUCCESS: '新增用户成功',
//   UPDATE_PROFILE: '更新用户资料',
//   // ...
// };

module.exports = {
  LOG_MODULE,
  LOG_ACTION_TYPE,
  LOG_DETAILS,
  // USER_LOG_DETAILS, // 如果定义了，也导出
}; 