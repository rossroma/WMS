import request from '@/utils/request'

// 获取分类树
export function getCategoryTree() {
  return request({
    url: '/categories/tree',
    method: 'get'
  })
}

// 获取分类列表
export function getCategoryList(params) {
  return request({
    url: '/categories',
    method: 'get',
    params
  })
}

// 创建分类
export function createCategory(data) {
  return request({
    url: '/categories',
    method: 'post',
    data
  })
}

// 更新分类
export function updateCategory(id, data) {
  return request({
    url: `/categories/${  id}`,
    method: 'put',
    data
  })
}

// 删除分类
export function deleteCategory(id) {
  return request({
    url: `/categories/${  id}`,
    method: 'delete'
  })
}

// 批量更新分类排序
export function batchUpdateSort(data) {
  return request({
    url: '/categories/batch-sort',
    method: 'post',
    data
  })
}
