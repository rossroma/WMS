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
  buildTree,
  generateUniqueId
}; 