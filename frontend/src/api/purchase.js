import request from '@/utils/request'

/**
 * 获取采购订单列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} params.status - 订单状态
 * @param {number} params.supplier_id - 供应商ID
 * @param {string} params.start_date - 开始日期
 * @param {string} params.end_date - 结束日期
 * @returns {Promise} 返回采购订单列表
 */
export function getPurchaseOrders(params) {
  return request({
    url: '/purchase-orders',
    method: 'get',
    params
  })
}

/**
 * 获取采购订单商品明细
 * @param {number} id - 采购订单ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise} 返回采购订单商品明细
 */
export function getPurchaseOrderItems(id, params) {
  return request({
    url: `/purchase-orders/${id}/items`,
    method: 'get',
    params
  })
}

/**
 * 创建采购订单
 * @param {Object} data - 采购订单数据
 * @returns {Promise} 返回创建的采购订单
 */
export function createPurchaseOrder(data) {
  return request({
    url: '/purchase-orders',
    method: 'post',
    data
  })
}

/**
 * 确认采购订单
 * @param {number} id - 采购订单ID
 * @returns {Promise} 返回确认结果
 */
export function confirmPurchaseOrder(id) {
  return request({
    url: `/purchase-orders/${id}/confirm`,
    method: 'post'
  })
}

/**
 * 删除采购订单
 * @param {number} id - 采购订单ID
 * @returns {Promise} 返回删除结果
 */
export function deletePurchaseOrder(id) {
  return request({
    url: `/purchase-orders/${id}`,
    method: 'delete'
  })
}

// 采购订单状态枚举
export const PURCHASE_ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED'
}

// 付款方式枚举
export const PAYMENT_METHOD = {
  CASH: '现金',
  BANK_TRANSFER: '银行转账',
  CHECK: '支票',
  OTHER: '其他'
} 
