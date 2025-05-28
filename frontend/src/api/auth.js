import request from '@/utils/request'

// 用户登录
export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

// 获取当前用户信息
export function getCurrentUser() {
  return request({
    url: '/auth/profile',
    method: 'get'
  })
}

// 用户登出
export function logout() {
  return request({
    url: '/auth/logout', // 确保这个URL与后端登出路由一致
    method: 'post'    // 或者 'get'，取决于后端 authController.logout 的实现方式
    // 如果后端需要，可能需要传递一些数据或头部
  })
}
