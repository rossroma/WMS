<template>
  <div class="login-container">
    <div class="login-wrapper">
      <el-card class="login-card" shadow="hover">
        <div class="login-header">
          <h1 class="system-title">仓库管理系统</h1>
          <p class="system-subtitle">Warehouse Management System</p>
        </div>
        
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="rules"
          label-width="0"
          @keyup.enter="handleLogin"
          class="login-form"
          size="large"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="用户名"
              :prefix-icon="User"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              :prefix-icon="Lock"
              show-password
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="loading"
              class="login-button"
              @click="handleLogin"
              size="large"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
        <div class="login-footer">
          <p class="copyright">© 2024 仓库管理系统. All rights reserved.</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
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
          
          // 获取重定向路径，如果没有则跳转到首页
          const redirect = router.currentRoute.value.query.redirect || '/'
          router.push(redirect)
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
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-wrapper {
  width: 100%;
  max-width: 420px;
}

.login-card {
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.system-title {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
  letter-spacing: 1px;
}

.system-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
  font-weight: 400;
}

.login-form {
  padding: 5px 30px 10px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.login-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.login-footer {
  text-align: center;
  padding: 20px 30px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.copyright {
  font-size: 12px;
  color: #95a5a6;
  margin: 0;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

:deep(.el-card__body) {
  padding: 0;
}

:deep(.el-form-item) {
  margin-bottom: 26px;
}

:deep(.el-checkbox__label) {
  font-size: 14px;
  color: #606266;
}

:deep(.el-link) {
  font-size: 14px;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}
</style> 
