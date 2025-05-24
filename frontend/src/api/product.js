import request from '@/utils/request'

// 获取商品列表
export function getProductList(params) {
  return request({
    url: '/products',
    method: 'get',
    params
  })
}

// 获取商品详情
export function getProductDetail(id) {
  return request({
    url: '/products/' + id,
    method: 'get'
  })
}

// 创建商品
export function createProduct(data) {
  return request({
    url: '/products',
    method: 'post',
    data
  })
}

// 更新商品
export function updateProduct(id, data) {
  return request({
    url: '/products/' + id,
    method: 'put',
    data
  })
}

// 删除商品
export function deleteProduct(id) {
  return request({
    url: '/products/' + id,
    method: 'delete'
  })
}

// 获取商品分类列表
export function getCategories() {
  return request({
    url: '/categories',
    method: 'get'
  })
}

// 获取供应商列表
export function getSuppliers() {
  return request({
    url: '/suppliers',
    method: 'get'
  })
}

// 创建商品分类
export function createCategory(data) {
  return request({
    url: '/categories',
    method: 'post',
    data
  })
}

// 更新商品分类
export function updateCategory(id, data) {
  return request({
    url: `/categories/${id}`,
    method: 'put',
    data
  })
}

// 删除商品分类
export function deleteCategory(id) {
  return request({
    url: `/categories/${id}`,
    method: 'delete'
  })
} 