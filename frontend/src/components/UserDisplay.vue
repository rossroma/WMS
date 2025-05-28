<template>
  <span v-if="displayName">{{ displayName }}</span>
  <span v-else class="unknown-user">{{ value || '-' }}</span>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useUsers } from '@/composables/useUsers'

// Props
const props = defineProps({
  value: {
    type: [String, Number],
    default: null
  }
})

// 使用用户数据composable
const { getUserDisplayName, isLoaded, getAllUsers } = useUsers()

// 计算显示名称
const displayName = computed(() => {
  return getUserDisplayName(props.value)
})

// 确保用户数据已加载
const ensureUsersLoaded = async() => {
  if (props.value && !isLoaded.value) {
    try {
      await getAllUsers()
    } catch (error) {
      console.error('加载用户数据失败:', error)
    }
  }
}

// 监听value变化
watch(() => props.value, () => {
  ensureUsersLoaded()
})

// 组件挂载时确保用户数据已加载
onMounted(() => {
  ensureUsersLoaded()
})
</script>

<style scoped>
.unknown-user {
  color: #909399;
  font-style: italic;
}
</style> 
