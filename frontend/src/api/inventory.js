import request from '@/utils/request'

// 获取库存列表
export function getInventoryList(params) {
  return request({
    url: '/inventory',
    method: 'get',
    params
  })
}

// 获取库存流水记录
export function getInventoryLogs(params) {
  return request({
    url: '/inventory/logs',
    method: 'get',
    params
  })
} 