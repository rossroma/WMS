import request from '@/utils/request'

// 获取供应商列表
export function getSupplierList(params) {
  return request({
    url: '/suppliers',
    method: 'get',
    params
  })
}

// 获取供应商详情
export function getSupplierDetail(id) {
  return request({
    url: '/suppliers/' + id,
    method: 'get'
  })
}

// 创建供应商
export function createSupplier(data) {
  return request({
    url: '/suppliers',
    method: 'post',
    data
  })
}

// 更新供应商
export function updateSupplier(id, data) {
  return request({
    url: '/suppliers/' + id,
    method: 'put',
    data
  })
}

// 删除供应商
export function deleteSupplier(id) {
  return request({
    url: '/suppliers/' + id,
    method: 'delete'
  })
} 