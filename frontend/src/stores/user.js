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
      // 可选：调用后端登出接口
      // await apiLogout(); // 确保 @/api/auth 中有 logout 方法并已导入
      // console.log('Backend logout successful');
    } catch (error) {
      console.error('Backend logout failed:', error);
      // 即便后端登出失败，前端也应继续清理
    }
    clearUserInfo();
    // 跳转到登录页，可以带上 redirect 参数，方便重新登录后跳回
    // router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } });
    // 或者直接跳转到登录页
    router.push({ name: 'Login' });
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