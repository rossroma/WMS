import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { hasRolePermission } from '@/utils/permission'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/Index.vue'),
      meta: { title: '登录', ignoreAuth: true, isMenu: false }
    },
    {
      path: '/',
      component: () => import('@/layout/Index.vue'),
      redirect: '/dashboard',
      meta: { isMenu: false },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/Index.vue'),
          meta: { 
            title: '仪表盘', 
            icon: 'DataBoard'
          }
        }
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
        icon: 'OfficeBuilding',
        needPermission: 'manager'
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
      path: '/purchase',
      component: () => import('@/layout/Index.vue'),
      redirect: '/purchase/orders',
      name: 'Purchase',
      meta: {
        title: '采购管理',
        icon: 'ShoppingCart',
        needPermission: 'manager'
      },
      children: [
        {
          path: 'orders',
          name: 'PurchaseOrders',
          component: () => import('@/views/purchase/PurchaseOrderList.vue'),
          meta: { title: '采购订单', icon: 'document' }
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
        },
        {
          path: 'stocktaking',
          name: 'Stocktaking',
          component: () => import('@/views/inventory/Stocktaking.vue'),
          meta: {
            title: '商品盘点',
            icon: 'DocumentChecked'
          }
        }
      ]
    },
    {
      path: '/warehouse',
      component: () => import('@/layout/Index.vue'),
      redirect: '/warehouse/inbound',
      name: 'Warehouse',
      meta: {
        title: '出入库管理',
        icon: 'Box'
      },
      children: [
        {
          path: 'inbound',
          name: 'InboundOrder',
          component: () => import('@/views/inbound/Index.vue'),
          meta: {
            title: '入库管理',
            icon: 'Download'
          }
        },
        {
          path: 'outbound',
          name: 'OutboundOrder',
          component: () => import('@/views/outbound/Index.vue'),
          meta: {
            title: '出库管理',
            icon: 'Upload'
          }
        }
      ]
    },
    {
      path: '/messages',
      name: 'Messages',
      component: () => import('@/layout/Index.vue'),
      redirect: '/messages/list',
      meta: {
        title: '消息管理',
        icon: 'Bell'
      },
      children: [
        {
          path: 'list',
          name: 'MessageList',
          component: () => import('@/views/messages/Index.vue'),
          meta: {
            title: '消息列表',
            icon: 'List'
          }
        }
      ]
    },
    {
      path: '/system',
      component: () => import('@/layout/Index.vue'),
      redirect: '/system/users',
      meta: {
        title: '系统管理',
        icon: 'Connection',
        needPermission: 'admin'
      },
      children: [
        {
          path: 'users',
          name: 'Users',
          component: () => import('@/views/system/UserManagement.vue'),
          meta: { title: '用户管理', icon: 'User' }
        },
        {
          path: 'logs',
          name: 'LogManagement',
          component: () => import('@/views/system/LogManagement.vue'),
          meta: { title: '日志管理', icon: 'Memo' }
        }
      ]
    }
  ]
})

// 路由守卫
router.beforeEach(async(to, from, next) => {
  const userStore = useUserStore()
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 仓库管理系统` : '仓库管理系统'
  // 判断是否需要登录权限
  if (!to.meta.ignoreAuth) {
    if (!userStore.token) {
      // 未登录，跳转到登录页
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
    
    // 已登录但没有用户信息，获取用户信息
    if (!userStore.userInfo.id) {
      try {
        await userStore.fetchUserInfo()
      } catch {
        // 获取用户信息失败，清除token并跳转到登录页
        userStore.clearUserInfo()
        next({ name: 'Login', query: { redirect: to.fullPath } })
        return
      }
    }
  }
  
  // 检查权限限制
  if (to.meta.needPermission) {
    // 检查角色权限
    const requiredRole = to.meta.needPermission
    const hasAccess = hasRolePermission(requiredRole)
    
    if (!hasAccess) {
      // 没有权限，重定向到仪表盘
      next({ name: 'Dashboard' })
      return
    }
  }
  
  // 已登录用户访问登录页，重定向到首页
  if (to.name === 'Login' && userStore.token) {
    next({ name: 'Dashboard' })
    return
  }
  
  next()
})

export default router
