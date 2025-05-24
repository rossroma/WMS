/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * 格式化日期时间
 * @param {Date|string} date - 日期对象或日期字符串
 * @param {string} format - 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * 深拷贝对象
 * @param {Object} obj - 要拷贝的对象
 * @returns {Object} 拷贝后的新对象
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [] : {};
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key]);
    }
  }
  return clone;
};

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
const throttle = (func, limit = 300) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * 检查对象是否为空
 * @param {Object} obj - 要检查的对象
 * @returns {boolean} 是否为空
 */
const isEmpty = (obj) => {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === 'string') return obj.trim().length === 0;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * 生成分页参数
 * @param {number} page - 当前页码
 * @param {number} pageSize - 每页数量
 * @returns {Object} 分页参数对象
 */
const getPagination = (page = 1, pageSize = 10) => {
  const offset = (page - 1) * pageSize;
  return {
    offset,
    limit: pageSize
  };
};

/**
 * 生成分页响应数据
 * @param {Array} data - 数据数组
 * @param {number} total - 总数量
 * @param {number} page - 当前页码
 * @param {number} pageSize - 每页数量
 * @returns {Object} 分页响应对象
 */
const getPagingData = (data, total, page, pageSize) => {
  const currentPage = parseInt(page);
  const totalPages = Math.ceil(total / pageSize);
  return {
    data,
    pagination: {
      total,
      pageSize,
      currentPage,
      totalPages
    }
  };
};

/**
 * 生成树形结构数据
 * @param {Array} data - 原始数据数组
 * @param {string} idKey - ID字段名
 * @param {string} parentIdKey - 父ID字段名
 * @param {string} childrenKey - 子节点字段名
 * @returns {Array} 树形结构数据
 */
const buildTree = (data, idKey = 'id', parentIdKey = 'parentId', childrenKey = 'children') => {
  const map = {};
  const result = [];

  // 构建映射
  data.forEach(item => {
    map[item[idKey]] = { ...item, [childrenKey]: [] };
  });

  // 构建树
  data.forEach(item => {
    const parent = map[item[parentIdKey]];
    if (parent) {
      parent[childrenKey].push(map[item[idKey]]);
    } else {
      result.push(map[item[idKey]]);
    }
  });

  return result;
};

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
const generateUniqueId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

module.exports = {
  generateRandomString,
  formatDateTime,
  deepClone,
  debounce,
  throttle,
  isEmpty,
  getPagination,
  getPagingData,
  buildTree,
  generateUniqueId
}; 