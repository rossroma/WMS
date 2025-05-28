<template>
  <div class="login-container">
    <div class="login-box">
      <el-card class="login-card">
        <template #header>
          <h2 class="login-title">仓库管理系统</h2>
        </template>
        
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="rules"
          label-width="0"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="用户名"
              :prefix-icon="User"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="loading"
              class="login-button"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async() => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async(valid) => {
    if (valid) {
      loading.value = true
      try {
        const { data } = await login(loginForm)
        console.log('登录响应:', data)
        if (data && data.token) {
          userStore.setToken(data.token)
          userStore.setUserInfo(data.user)
          ElMessage.success('登录成功')
          router.push('/')
        } else {
          ElMessage.error('登录响应格式错误')
        }
      } catch (error) {
        console.error('登录失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
  background-image: linear-gradient(to right, #1890ff, #36cfc9);
}

.login-box {
  width: 100%;
  max-width: 1200px;
  padding: 0 20px;
  display: flex;
  justify-content: center;
}

.login-card {
  width: 400px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin: 0;
  color: #303133;
  font-size: 24px;
}

.login-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
}

:deep(.el-card__header) {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-card__body) {
  padding: 30px 20px;
}
</style> 
