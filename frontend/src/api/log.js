import request from '@/utils/request'

// 获取操作日志列表
export function getLogs(params) {
  return request({
    url: '/logs',
    method: 'get',
    params
  })
}

// 获取登录日志列表
export function getLoginLogList(params) {
  return request({
    url: '/logs/login',
    method: 'get',
    params
  })
}

// 导出操作日志
export function exportLogs(params) {
  return request({
    url: '/logs/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 导出登录日志
export function exportLoginLogs(params) {
  return request({
    url: '/logs/login/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

export function getLogFilterOptions() {
  return request({
    url: '/logs/filter-options',
    method: 'get',
  });
} 