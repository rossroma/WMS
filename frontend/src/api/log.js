import request from '@/utils/request'

// 获取操作日志列表
export function getLogs(params) {
  return request({
    url: '/logs',
    method: 'get',
    params
  })
}

// 日志筛选
export function getLogFilterOptions() {
  return request({
    url: '/logs/filter-options',
    method: 'get'
  })
} 
