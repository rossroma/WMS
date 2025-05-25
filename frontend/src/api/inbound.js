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

// 获取入库单关联商品列表
export function getInboundItems(id, params) {
  return request({
    url: '/inbound-orders/' + id + '/items',
    method: 'get',
    params
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

// 更新入库单（可以更新：type、orderDate、operator、remark）
export function updateInbound(id, data) {
  return request({
    url: '/inbound-orders/' + id,
    method: 'put',
    data
  })
}

// 删除入库单
export function deleteInbound(id) {
  return request({
    url: '/inbound-orders/' + id,
    method: 'delete'
  })
} 