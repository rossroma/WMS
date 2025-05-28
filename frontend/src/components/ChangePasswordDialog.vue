<template>
  <el-dialog
    v-model="visible"
    title="修改密码"
    width="500px"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    @closed="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="form.newPassword" type="password" show-password placeholder="请输入新密码 (至少6位)" />
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          确认修改
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
// 修改导入，使用 changeUserPassword
import { changeUserPassword } from '@/api/user' 
import { useUserStore } from '@/stores/user' // 导入 userStore 以获取用户ID

const props = defineProps({
  modelValue: Boolean 
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = ref(false)
const loading = ref(false)
const formRef = ref(null)
const userStore = useUserStore() // 初始化 userStore

const form = reactive({
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== form.newPassword) {
    callback(new Error('两次输入的新密码不一致!'))
  } else {
    callback()
  }
}

const rules = reactive({
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
})

watch(() => props.modelValue, (val) => {
  visible.value = val
})

const handleClose = () => {
  formRef.value?.resetFields()
  form.newPassword = ''
  form.confirmPassword = ''
  emit('update:modelValue', false)
}

const handleCancel = () => {
  visible.value = false 
}

const handleSubmit = async() => {
  if (!formRef.value) return
  await formRef.value.validate(async(valid) => {
    if (valid) {
      loading.value = true
      try {
        const currentUserId = userStore.userInfo?.id
        if (!currentUserId) {
          ElMessage.error('无法获取用户信息，请重新登录。')
          loading.value = false
          return
        }

        await changeUserPassword(currentUserId, { 
          newPassword: form.newPassword 
        })
 
        ElMessage.success('密码修改成功！')
        emit('success') 
        visible.value = false 
      } catch (error) {
        console.error('密码修改失败:', error)
        ElMessage.error(error.message || '密码修改失败，请重试。')
      } finally {
        loading.value = false
      }
    }
  })
}

</script>

<style scoped>
.dialog-footer {
  text-align: right;
}
</style> 
