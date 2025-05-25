import request from '@/utils/request'

// 获取综合dashboard数据
export function getDashboardData() {
  return request({
    url: '/dashboard/data',
    method: 'get'
  })
}

// 获取今日入库数量
export function getTodayInboundCount() {
  return request({
    url: '/dashboard/today-inbound',
    method: 'get'
  })
}

// 获取今日出库数量
export function getTodayOutboundCount() {
  return request({
    url: '/dashboard/today-outbound',
    method: 'get'
  })
}

// 获取库存预警数量
export function getStockWarningCount() {
  return request({
    url: '/dashboard/stock-warning',
    method: 'get'
  })
}

// 获取盘点准确率
export function getStocktakingAccuracy() {
  return request({
    url: '/dashboard/stocktaking-accuracy',
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