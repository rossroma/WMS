import { ref, computed } from 'vue'
import { getUserList } from '@/api/user'

// 全局用户数据状态
const userList = ref([])
const isLoading = ref(false)
const isLoaded = ref(false)
let loadPromise = null

// 获取用户列表的单例方法
const fetchUsers = async () => {
  // 如果已经在加载中，返回同一个Promise
  if (loadPromise) {
    return loadPromise
  }
  
  // 如果已经加载过，直接返回
  if (isLoaded.value) {
    return Promise.resolve(userList.value)
  }
  
  isLoading.value = true
  
  loadPromise = getUserList({ pageSize: 1000 })
    .then(response => {
      const userData = response.data || response
      const allUsers = userData.list || userData || []
      userList.value = allUsers
      isLoaded.value = true
      return allUsers
    })
    .catch(error => {
      console.error('获取用户列表失败:', error)
      throw error
    })
    .finally(() => {
      isLoading.value = false
      loadPromise = null
    })
  
  return loadPromise
}

// 重置用户数据（用于刷新）
const resetUsers = () => {
  userList.value = []
  isLoaded.value = false
  loadPromise = null
}

// 用户数据的composable
export const useUsers = () => {
  // 获取所有用户
  const getAllUsers = async () => {
    await fetchUsers()
    return userList.value
  }
  
  // 获取启用的用户
  const getEnabledUsers = async () => {
    await fetchUsers()
    return userList.value.filter(user => user.status === 'active')
  }
  
  // 根据ID获取用户
  const getUserById = (id) => {
    if (!id || !isLoaded.value) return null
    return userList.value.find(u => u.id === parseInt(id))
  }
  
  // 根据用户名获取用户
  const getUserByUsername = (username) => {
    if (!username || !isLoaded.value) return null
    return userList.value.find(u => u.username === username)
  }
  
  // 获取用户显示名称
  const getUserDisplayName = (value) => {
    if (!value || !isLoaded.value) return null
    
    // 尝试通过ID查找用户
    let user = getUserById(value)
    
    // 如果通过ID找不到，尝试通过用户名查找
    if (!user) {
      user = getUserByUsername(value)
    }
    
    return user ? user.fullname : null
  }
  
  return {
    userList: computed(() => userList.value),
    isLoading: computed(() => isLoading.value),
    isLoaded: computed(() => isLoaded.value),
    getAllUsers,
    getEnabledUsers,
    getUserById,
    getUserByUsername,
    getUserDisplayName,
    resetUsers
  }
} 