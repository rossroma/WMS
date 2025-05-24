import request from '@/utils/request'

// 获取入库单列表
export function getInboundList(params) {
  return request({
    url: '/inbound-orders',
    method: 'get',
    params
  })
}

// 获取入库单详情
export function getInboundDetail(id) {
  return request({
    url: '/inbound-orders/' + id,
    method: 'get'
  })
}

// 创建入库单
export function createInbound(data) {
  return request({
    url: '/inbound-orders',
    method: 'post',
    data
  })
}

// 完成入库
export function completeInbound(id) {
  return request({
    url: '/inbound-orders/' + id + '/complete',
    method: 'put'
  })
}

// 删除入库单
export function deleteInbound(id) {
  return request({
    url: '/inbound-orders/' + id,
    method: 'delete'
  })
} 