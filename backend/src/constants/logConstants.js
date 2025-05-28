// 日志模块常量

// 操作模块
const LOG_MODULE = {
  USER: '用户管理',
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
  CHANGE_PASSWORD: '修改密码',
  UPLOAD: '上传文件',
  DOWNLOAD: '下载文件',
  ENABLE: '启用',
  DISABLE: '禁用',
};

const LOG_DETAILS = {
  LOGIN_SUCCESS: '登录成功',
  LOGIN_FAILURE: '登录失败',
  PASSWORD_RESET_REQUEST: '请求重置密码',
  PASSWORD_RESET_SUCCESS: '密码重置成功',
};


module.exports = {
  LOG_MODULE,
  LOG_ACTION_TYPE,
  LOG_DETAILS,
}; 