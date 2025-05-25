<template>
  <span v-if="displayName">{{ displayName }}</span>
  <span v-else class="unknown-user">{{ value || '-' }}</span>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getUserList } from '@/api/user'

// Props
const props = defineProps({
  value: {
    type: [String, Number],
    default: null
  }
})

// 响应式数据
const userList = ref([])
const isLoaded = ref(false)

// 计算显示名称
const displayName = computed(() => {
  if (!props.value || !isLoaded.value) return null
  
  // 尝试通过ID查找用户
  let user = userList.value.find(u => u.id === parseInt(props.value))
  
  // 如果通过ID找不到，尝试通过用户名查找
  if (!user) {
    user = userList.value.find(u => u.username === props.value)
  }
  
  return user ? user.fullname : null
})

// 获取用户列表
const fetchUsers = async () => {
  try {
    const response = await getUserList()
    const userData = response.data || response
    userList.value = userData.list || userData || []
    isLoaded.value = true
  } catch (error) {
    console.error('获取用户列表失败:', error)
    isLoaded.value = true
  }
}

// 监听value变化
watch(() => props.value, () => {
  if (props.value && !isLoaded.value) {
    fetchUsers()
  }
})

// 组件挂载时获取用户列表
onMounted(() => {
  if (props.value) {
    fetchUsers()
  }
})
</script>

<style scoped>
.unknown-user {
  color: #909399;
  font-style: italic;
}
</style> 