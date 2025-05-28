import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCurrentUser, logout as apiLogout } from '@/api/auth'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

  // 设置token
  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  // 设置用户信息
  function setUserInfo(info) {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  // 清除用户信息
  function clearUserInfo() {
    token.value = ''
    userInfo.value = {}
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  // 获取用户信息
  async function fetchUserInfo() {
    try {
      const res = await getCurrentUser()
      setUserInfo(res.data)
      return res.data
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  // 用户登出 Action
  async function logout() {
    try {
      // 调用后端登出接口，使 token 失效
      await apiLogout()
      console.log('后端登出成功')
    } catch (error) {
      console.error('后端登出失败:', error)
    }
    
    // 清理本地数据
    clearUserInfo()
    
    // 跳转到登录页，保存当前路由用于登录后跳回
    const currentRoute = router.currentRoute.value
    if (currentRoute.name !== 'Login') {
      router.push({ 
        name: 'Login', 
        query: { redirect: currentRoute.fullPath } 
      })
    }
  }

  return {
    token,
    userInfo,
    setToken,
    setUserInfo,
    clearUserInfo,
    fetchUserInfo,
    logout
  }
}) 
