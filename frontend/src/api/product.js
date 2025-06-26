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
    url: `/products/${  id}`,
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
    url: `/products/${  id}`,
    method: 'put',
    data
  })
}

// 获取商品选择列表（包含库存信息）
export function getProductsForSelect(params) {
  return request({
    url: '/products/select/list',
    method: 'get',
    params
  })
}

// 删除商品
export function deleteProduct(id) {
  return request({
    url: `/products/${  id}`,
    method: 'delete'
  })
} 
