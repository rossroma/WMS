import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

// 特殊字符过滤函数
const filterSpecialChars = (data) => {
  if (typeof data === 'string') {
    return data
      // 过滤HTML标签
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      // 过滤危险的事件处理器
      .replace(/on\w+\s*=/gi, '')
      // 过滤javascript和vbscript协议
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      // 过滤SQL注入相关字符
      .replace(/'/g, '&#39;')
      .replace(/"/g, '&quot;')
      .replace(/--/g, '&#45;&#45;')
      .replace(/\/\*/g, '&#47;&#42;')
      .replace(/\*\//g, '&#42;&#47;')
      // 过滤其他潜在危险字符
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim()
  }
  
  if (Array.isArray(data)) {
    return data.map(item => filterSpecialChars(item))
  }
  
  if (data && typeof data === 'object') {
    const filteredData = {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        filteredData[key] = filterSpecialChars(data[key])
      }
    }
    return filteredData
  }
  
  return data
}

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
    
    // 对请求数据进行特殊字符过滤
    if (config.data) {
      config.data = filterSpecialChars(config.data)
    }
    
    if (config.params) {
      config.params = filterSpecialChars(config.params)
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
          // 延迟1秒跳转，让错误信息有时间显示
          window.setTimeout(() => {
            window.location.href = '/login'
          }, 1000)
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
