import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/Index.vue'),
      meta: { title: '登录', requiresAuth: false }
    },
    {
      path: '/organization',
      component: () => import('@/layout/Index.vue'),
      redirect: '/organization/users',
      meta: {
        title: '组织架构',
        icon: 'Connection'
      },
      children: [
        {
          path: 'users',
          name: 'Users',
          component: () => import('@/views/organization/users/Index.vue'),
          meta: { title: '用户管理', icon: 'User', requiresAuth: true }
        },
        // {
        //   path: 'password',
        //   name: 'ChangePassword',
        //   component: () => import('@/views/profile/ChangePassword.vue'),
        //   meta: { title: '修改密码', requiresAuth: true }
        // }
      ]
    },
    {
      path: '/product',
      component: () => import('@/layout/Index.vue'),
      redirect: '/product/list',
      name: 'Product',
      meta: {
        title: '商品管理',
        icon: 'ShoppingCart'
      },
      children: [
        {
          path: 'list',
          name: 'ProductList',
          component: () => import('@/views/product/Index.vue'),
          meta: {
            title: '商品列表',
            icon: 'List'
          }
        }
      ]
    },
    {
      path: '/supplier',
      component: () => import('@/layout/Index.vue'),
      redirect: '/supplier/list',
      name: 'Supplier',
      meta: {
        title: '供应商管理',
        icon: 'OfficeBuilding'
      },
      children: [
        {
          path: 'list',
          name: 'SupplierList',
          component: () => import('@/views/supplier/Index.vue'),
          meta: {
            title: '供应商列表',
            icon: 'List'
          }
        }
      ]
    },
    {
      path: '/inventory',
      component: () => import('@/layout/Index.vue'),
      redirect: '/inventory/list',
      name: 'Inventory',
      meta: {
        title: '库存管理',
        icon: 'DataBoard'
      },
      children: [
        {
          path: 'list',
          name: 'InventoryList',
          component: () => import('@/views/inventory/Index.vue'),
          meta: {
            title: '库存查询',
            icon: 'Search'
          }
        },
        {
          path: 'logs',
          name: 'InventoryLogs',
          component: () => import('@/views/inventory/Logs.vue'),
          meta: {
            title: '库存流水',
            icon: 'List'
          }
        }
      ]
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 仓库管理系统` : '仓库管理系统'
  
  // 判断是否需要登录权限
  if (to.meta.requiresAuth) {
    if (!userStore.token) {
      // 未登录，跳转到登录页
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
    
    // 已登录但没有用户信息，获取用户信息
    if (!userStore.userInfo.id) {
      try {
        await userStore.fetchUserInfo()
      } catch (error) {
        // 获取用户信息失败，清除token并跳转到登录页
        userStore.clearUserInfo()
        next({ name: 'Login', query: { redirect: to.fullPath } })
        return
      }
    }
  }
  
  // 已登录用户访问登录页，重定向到首页
  if (to.name === 'Login' && userStore.token) {
    next({ name: 'Users' })
    return
  }
  
  next()
})

export default router