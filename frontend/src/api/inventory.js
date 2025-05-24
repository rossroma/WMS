import request from '@/utils/request'

// 获取库存列表
export function getInventoryList(params) {
  return request({
    url: '/inventory',
    method: 'get',
    params
  })
}

// 获取库存详情
export function getInventoryDetail(id) {
  return request({
    url: '/inventory/' + id,
    method: 'get'
  })
}

// 更新库存
export function updateInventory(id, data) {
  return request({
    url: '/inventory/' + id,
    method: 'put',
    data
  })
} 