<template>
  <div class="app-wrapper">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <div class="left">
        <h2>仓库管理系统</h2>
      </div>
      <div class="right">
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            {{ userStore.userInfo.fullname || userStore.userInfo.username }}
            <el-icon><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="changePassword">修改密码</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-container">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 处理下拉菜单命令
const handleCommand = async (command) => {
  switch (command) {
    case 'changePassword':
      router.push('/profile/password')
      break
    case 'logout':
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      userStore.clearUserInfo()
      router.push('/login')
      break
  }
}
</script>

<style scoped>
.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  height: 60px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.left h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #606266;
}

.user-info .el-icon {
  margin-left: 4px;
}

.main-container {
  flex: 1;
  background-color: #f5f7fa;
  padding: 20px;
}
</style> 