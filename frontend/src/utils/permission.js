import { useUserStore } from '@/stores/user'

// 角色等级定义（数字越大权限越高）
const ROLE_LEVELS = {
  'operator': 1,
  'manager': 2,
  'admin': 3
};

/**
 * 获取当前用户角色
 * @returns {string|null} 用户角色
 */
export const getCurrentUserRole = () => {
  const userStore = useUserStore()
  return userStore.userInfo?.role || null
}

/**
 * 检查当前用户角色是否大于等于指定角色
 * @param {string} requiredRole - 所需的最小角色
 * @returns {boolean} 是否有权限
 */
export const hasRolePermission = (requiredRole) => {
  const currentRole = getCurrentUserRole()
  
  if (!currentRole || !requiredRole) {
    return false
  }
  
  const currentLevel = ROLE_LEVELS[currentRole] || 0
  const requiredLevel = ROLE_LEVELS[requiredRole] || 0
  
  return currentLevel >= requiredLevel
}
