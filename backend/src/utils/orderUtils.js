/**
 * 生成订单号的通用方法
 * @param {string} prefix 订单号前缀，如 'IN'、'OUT'、'ST' 等
 * @returns {string} 生成的订单号
 */
const generateOrderNo = (prefix) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  
  return `${prefix}${year}${month}${day}${timestamp}`;
};

/**
 * 生成入库单号
 * @returns {string} 入库单号
 */
const generateInboundOrderNo = () => {
  return generateOrderNo('IN');
};

/**
 * 生成出库单号
 * @returns {string} 出库单号
 */
const generateOutboundOrderNo = () => {
  return generateOrderNo('OUT');
};

/**
 * 生成盘点单号
 * @returns {string} 盘点单号
 */
const generateStocktakingOrderNo = () => {
  return generateOrderNo('ST');
};

/**
 * 订单号前缀枚举
 */
const OrderNoPrefix = {
  INBOUND: 'IN',
  OUTBOUND: 'OUT',
  STOCKTAKING: 'ST'
};

module.exports = {
  generateOrderNo,
  generateInboundOrderNo,
  generateOutboundOrderNo,
  generateStocktakingOrderNo,
  OrderNoPrefix
}; 