import request from '@/utils/request'

// 获取综合dashboard数据
export function getDashboardData() {
  return request({
    url: '/dashboard/data',
    method: 'get'
  })
}

// 获取近7天出入库趋势
export function getWeeklyTrend() {
  return request({
    url: '/dashboard/weekly-trend',
    method: 'get'
  })
}

// 获取热销商品
export function getHotProducts() {
  return request({
    url: '/dashboard/hot-products',
    method: 'get'
  })
}

// 获取预警商品
export function getWarningProducts() {
  return request({
    url: '/dashboard/warning-products',
    method: 'get'
  })
} 
