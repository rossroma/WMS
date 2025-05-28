import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    return res
  },
  error => {
    let message = '请求失败'
    
    if (error.response) {
      const { status, data } = error.response
      switch (status) {
        case 401: {
          message = '未授权，请重新登录'
          const userStore = useUserStore()
          userStore.clearUserInfo()
          window.location.href = '/login'
          break
        }
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求地址出错'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = data?.message || '请求失败'
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时'
    } else {
      message = '网络连接失败'
    }

    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default service 
