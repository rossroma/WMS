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
    url: `/outbound-orders/${  id}`,
    method: 'get'
  })
}

// 获取出库单关联商品列表
export function getOutboundItems(id, params) {
  return request({
    url: `/outbound-orders/${  id  }/items`,
    method: 'get',
    params
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

// 更新出库单（可以更新：type、orderDate、operator、remark）
export function updateOutbound(id, data) {
  return request({
    url: `/outbound-orders/${  id}`,
    method: 'put',
    data
  })
}

// 删除出库单
export function deleteOutbound(id) {
  return request({
    url: `/outbound-orders/${  id}`,
    method: 'delete'
  })
} 
