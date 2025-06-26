<template>
  <div class="layout-container">
    <!-- 左侧菜单 -->
    <div class="sidebar">
      <div class="logo">
        <!-- <img src="@/assets/logo.png" alt="logo"> -->
        <router-link to="/" class="logo-link">
          <span v-if="!isCollapse">仓库管理系统</span>
          <span v-else class="logo-short">WMS</span>
        </router-link>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        :collapse="isCollapse"
        :unique-opened="true"
        :router="true"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <template v-for="routeItem in routes" :key="routeItem.path">
          <!-- 有子菜单的情况 -->
          <el-sub-menu v-if="routeItem.children && routeItem.children.length > 0" :index="routeItem.path">
            <template #title>
              <el-icon><component :is="routeItem.meta?.icon" /></el-icon>
              <span>{{ routeItem.meta?.title }}</span>
            </template>
            <el-menu-item
              v-for="child in routeItem.children"
              :key="child.path"
              :index="routeItem.path + '/' + child.path"
            >
              <el-icon><component :is="child.meta?.icon" /></el-icon>
              <span>{{ child.meta?.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          
          <!-- 没有子菜单的情况 -->
          <el-menu-item v-else :index="routeItem.path">
            <el-icon><component :is="routeItem.meta?.icon" /></el-icon>
            <span>{{ routeItem.meta?.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </div>

    <!-- 右侧内容区 -->
    <div class="main-container">
      <!-- 顶部导航栏 -->
      <div class="navbar">
        <div class="left">
          <el-icon
            class="fold-btn"
            @click="toggleSidebar"
          >
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
          <breadcrumb />
        </div>
        <div class="right">
          <MessageNotification />
          <el-dropdown trigger="click">
            <div class="avatar-container">
              <el-avatar :size="32" :src="userStore.userInfo.avatar">
                {{ userStore.userInfo.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <span class="username">{{ userStore.userInfo.username }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleChangePassword">
                  <el-icon><Key /></el-icon>修改密码
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 主要内容区 -->
      <div class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <ChangePasswordDialog 
      v-model="showChangePasswordDialog" 
      @success="handlePasswordChangeSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'
import Breadcrumb from './components/Breadcrumb.vue'
import MessageNotification from '@/components/MessageNotification.vue'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'
import { hasRolePermission } from '@/utils/permission'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 控制侧边栏折叠
const isCollapse = ref(false)
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

// 获取路由配置 - 根据权限过滤菜单
const routes = computed(() => {
  return router.options.routes.filter(route => {
    // 过滤掉不显示在菜单中的路由
    if (route.meta?.isMenu === false || !route.children) {
      return false
    }
    
    // 检查角色权限限制
    if (route.meta?.needPermission) {
      const requiredRole = route.meta.needPermission
      return hasRolePermission(requiredRole)
    }
    
    return true
  })
})

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

// 修改密码弹窗控制
const showChangePasswordDialog = ref(false)

const handleChangePassword = () => {
  showChangePasswordDialog.value = true
}

const handlePasswordChangeSuccess = () => {
  userStore.logout()
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async() => {
    await userStore.logout()
    router.push('/login')
  })
}
</script>

<style lang="scss" scoped>
.layout-container {
  display: flex;
  height: 100vh;
  width: 100%;

  .sidebar {
    width: v-bind('isCollapse ? "64px" : "210px"');
    height: 100%;
    background-color: #304156;
    transition: width 0.3s;
    overflow: hidden;

    .logo {
      height: 60px;
      display: flex;
      align-items: center;
      padding: v-bind('isCollapse ? "0 8px" : "0 16px"');
      color: #fff;
      font-size: 18px;
      font-weight: bold;
      overflow: hidden;
      justify-content: v-bind('isCollapse ? "center" : "flex-start"');

      img {
        width: 32px;
        height: 32px;
        margin-right: 12px;
      }

      .logo-link {
        color: #fff;
        text-decoration: none;
        transition: opacity 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        
        &:hover {
          opacity: 0.8;
        }
        
        span {
          cursor: pointer;
          white-space: nowrap;
        }
        
        .logo-short {
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 1px;
        }
      }
    }

    .el-menu {
      border-right: none;
    }
  }

  .main-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .navbar {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      background-color: #fff;
      box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

      .left {
        display: flex;
        align-items: center;

        .fold-btn {
          padding: 0 16px;
          cursor: pointer;
          font-size: 20px;
        }
      }

      .right {
        display: flex;
        align-items: center;
        gap: 16px;

        .avatar-container {
          display: flex;
          align-items: center;
          cursor: pointer;

          .username {
            margin-left: 8px;
            font-size: 14px;
          }
        }
      }
    }

    .app-main {
      flex: 1;
      overflow-y: auto;
      background-color: #f0f2f5;
    }
  }
}

// 路由切换动画
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style> 
