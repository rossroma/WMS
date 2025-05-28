import request from '@/utils/request'

// 获取盘点单列表
export function getStocktakingList(params) {
  return request({
    url: '/stocktaking-orders',
    method: 'get',
    params
  })
}

// 创建盘点单
export function createStocktaking(data) {
  return request({
    url: '/stocktaking-orders',
    method: 'post',
    data
  })
}

// 删除盘点单
export function deleteStocktaking(id) {
  return request({
    url: `/stocktaking-orders/${id}`,
    method: 'delete'
  })
}

// 获取盘点商品明细
export function getStocktakingItems(id, params) {
  return request({
    url: `/stocktaking-orders/${id}/items`,
    method: 'get',
    params
  })
}
