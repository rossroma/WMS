<template>
  <el-select
    v-model="selectedValue"
    placeholder="请选择负责人"
    filterable
    clearable
    :loading="loading"
    :disabled="disabled"
    @change="handleChange"
    style="width: 100%"
  >
    <el-option
      v-for="user in enabledUsers"
      :key="user.id"
      :label="user.fullname"
      :value="user.id"
    >
      <span>{{ user.fullname }}</span>
      <span class="user-info">[{{ user.username }}]</span>
    </el-option>
  </el-select>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { getUserList } from '@/api/user'
import { ElMessage } from 'element-plus'

// Props
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change'])

// 响应式数据
const selectedValue = ref(null)
const enabledUsers = ref([])
const loading = ref(false)
const isUserListLoaded = ref(false)

// 更新选中值
const updateSelectedValue = (value) => {
  if (!value) {
    selectedValue.value = null
    return
  }
  
  // 确保数据类型一致
  const numValue = parseInt(value)
  
  // 如果用户列表已加载，验证用户是否存在
  if (isUserListLoaded.value) {
    const user = enabledUsers.value.find(u => u.id === numValue)
    selectedValue.value = user ? numValue : null
  } else {
    // 用户列表未加载，直接设置值
    selectedValue.value = numValue
  }
}

// 处理选择变化
const handleChange = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
}

// 获取启用的用户列表
const fetchEnabledUsers = async () => {
  loading.value = true
  try {
    const response = await getUserList()
    
    // 根据返回数据结构调整
    const userData = response.data || response
    const allUsers = userData.list || userData || []
    
    // 只显示active状态的用户
    enabledUsers.value = allUsers.filter(user => user.status === 'active')
    isUserListLoaded.value = true
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
    enabledUsers.value = []
    isUserListLoaded.value = true
  } finally {
    loading.value = false
  }
}

// 监听modelValue变化，但需要等待用户列表加载完成
watch(() => props.modelValue, (newVal) => {
  updateSelectedValue(newVal)
}, { immediate: true })

// 监听用户列表加载状态，加载完成后更新选中值
watch(isUserListLoaded, (loaded) => {
  if (loaded && props.modelValue) {
    updateSelectedValue(props.modelValue)
  }
})

// 组件挂载时获取用户列表
onMounted(() => {
  fetchEnabledUsers()
})
</script>

<style lang="scss" scoped>
:deep(.el-select-dropdown__item) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .user-info {
    font-size: 12px;
    color: #909399;
    margin-left: 8px;
  }
}
</style> 