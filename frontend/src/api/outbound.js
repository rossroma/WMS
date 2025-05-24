import request from '@/utils/request'

// 获取出库单列表
export function getOutboundList(params) {
  return request({
    url: '/outbound-orders',
    method: 'get',
    params
  })
}

// 获取出库单详情
export function getOutboundDetail(id) {
  return request({
    url: '/outbound-orders/' + id,
    method: 'get'
  })
}

// 创建出库单
export function createOutbound(data) {
  return request({
    url: '/outbound-orders',
    method: 'post',
    data
  })
}

// 完成出库
export function completeOutbound(id) {
  return request({
    url: '/outbound-orders/' + id + '/complete',
    method: 'put'
  })
}

// 删除出库单
export function deleteOutbound(id) {
  return request({
    url: '/outbound-orders/' + id,
    method: 'delete'
  })
} 