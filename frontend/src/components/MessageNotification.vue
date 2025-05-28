<template>
  <div class="message-notification">
    <el-popover
      placement="bottom-end"
      :width="400"
      trigger="click"
      v-model:visible="popoverVisible"
    >
      <template #reference>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="message-badge">
          <el-button 
            type="text" 
            class="message-btn"
            @click="handleToggle"
          >
            <el-icon size="18">
              <Bell />
            </el-icon>
          </el-button>
        </el-badge>
      </template>

      <div class="message-popover">
        <div class="message-header">
          <span class="title">消息通知</span>
          <div class="actions">
            <el-button 
              type="text" 
              size="small" 
              @click="handleMarkAllRead"
              :disabled="unreadCount === 0"
            >
              全部已读
            </el-button>
            <el-button 
              type="text" 
              size="small" 
              @click="handleViewAll"
            >
              查看全部
            </el-button>
          </div>
        </div>

        <div class="message-list" v-loading="loading">
          <div v-if="messages.length === 0" class="empty-state">
            <el-empty description="暂无未读消息" :image-size="60" />
          </div>
          <div v-else>
            <div 
              v-for="message in messages" 
              :key="message.id"
              class="message-item"
              :class="{ 'unread': !message.isRead }"
            >
              <div class="message-content">
                <div class="message-type">
                  <el-tag 
                    :type="getMessageTypeColor(message.type)" 
                    size="small"
                  >
                    {{ getMessageTypeText(message.type) }}
                  </el-tag>
                </div>
                <div class="message-text">{{ message.content }}</div>
                <div class="message-meta">
                  <span class="pusher" v-if="message.pusher">{{ message.pusher }}</span>
                  <span class="time">{{ formatTime(message.createdAt) }}</span>
                </div>
              </div>
              <div class="message-actions" v-if="!message.isRead">
                <el-button 
                  type="text" 
                  size="small"
                  class="read-btn"
                  @click="handleMarkRead(message)"
                >
                  <el-icon size="12">
                    <CircleCheck />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, CircleCheck } from '@element-plus/icons-vue'
import { getUnreadMessages, getUnreadCount, markAsRead, markAllAsRead } from '@/api/message'
import { useRouter } from 'vue-router'
import { formatRelativeTime } from '@/utils/date'

const router = useRouter()

// 响应式数据
const popoverVisible = ref(false)
const loading = ref(false)
const messages = ref([])
const unreadCount = ref(0)

// 轮询定时器
let pollingTimer = null

// 消息类型映射
const messageTypeMap = {
  'INVENTORY_ALERT': '库存预警',
  'STOCK_IN': '盘盈入库',
  'STOCK_OUT': '盘亏出库'
}

// 消息类型颜色映射
const messageTypeColorMap = {
  'INVENTORY_ALERT': 'warning',
  'STOCK_IN': 'success',
  'STOCK_OUT': 'danger'
}

// 获取消息类型文本
const getMessageTypeText = (type) => {
  return messageTypeMap[type] || type
}

// 获取消息类型颜色
const getMessageTypeColor = (type) => {
  return messageTypeColorMap[type] || 'info'
}

// 格式化时间
const formatTime = (dateString) => {
  return formatRelativeTime(dateString)
}

// 获取未读消息数量
const fetchUnreadCount = async() => {
  try {
    const res = await getUnreadCount()
    unreadCount.value = res.data.count || 0
  } catch (error) {
    console.error('获取未读消息数量失败:', error)
  }
}

// 获取未读消息列表
const fetchUnreadMessages = async() => {
  loading.value = true
  try {
    const res = await getUnreadMessages()
    messages.value = res.data || []
  } catch (error) {
    console.error('获取未读消息失败:', error)
    ElMessage.error('获取未读消息失败')
  }
  loading.value = false
}

// 切换弹窗显示
const handleToggle = () => {
  if (!popoverVisible.value) {
    fetchUnreadMessages()
  }
}

// 标记单条消息为已读
const handleMarkRead = async(message) => {
  try {
    await markAsRead(message.id)
    message.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    ElMessage.success('消息已标记为已读')
  } catch (error) {
    console.error('标记消息已读失败:', error)
    ElMessage.error('标记消息已读失败')
  }
}

// 标记所有消息为已读
const handleMarkAllRead = async() => {
  try {
    await markAllAsRead()
    messages.value.forEach(msg => msg.isRead = true)
    unreadCount.value = 0
    ElMessage.success('所有消息已标记为已读')
  } catch (error) {
    console.error('标记所有消息已读失败:', error)
    ElMessage.error('标记所有消息已读失败')
  }
}

// 查看全部消息
const handleViewAll = () => {
  popoverVisible.value = false
  router.push('/messages')
}

// 开始轮询
const startPolling = () => {
  // 立即执行一次
  fetchUnreadCount()
  
  // 每5分钟轮询一次
  pollingTimer = setInterval(() => {
    fetchUnreadCount()
  }, 5 * 60 * 1000) // 5分钟
}

// 停止轮询
const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

// 组件挂载时开始轮询
onMounted(() => {
  startPolling()
})

// 组件卸载时停止轮询
onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.message-notification {
  display: inline-block;
}

.message-badge {
  cursor: pointer;
}

.message-btn {
  padding: 8px;
  color: #606266;
  border: none;
  background: none;
}

.message-btn:hover {
  color: #409eff;
  background: rgba(64, 158, 255, 0.1);
}

.message-popover {
  padding: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background: #f5f7fa;
}

.message-header .title {
  font-weight: 500;
  color: #303133;
}

.message-header .actions {
  display: flex;
  gap: 8px;
}

.message-list {
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  padding: 20px;
  text-align: center;
}

.message-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.message-item:hover {
  background-color: #f5f7fa;
}

.message-item.unread {
  background-color: #f0f9ff;
  border-left: 3px solid #409eff;
}

.message-item:last-child {
  border-bottom: none;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-type {
  margin-bottom: 4px;
}

.message-text {
  font-size: 14px;
  color: #303133;
  line-height: 1.4;
  margin-bottom: 4px;
  word-break: break-word;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.message-actions {
  margin-left: 8px;
  flex-shrink: 0;
}

.read-btn {
  padding: 4px;
  color: #409eff;
}

.read-btn:hover {
  background-color: rgba(64, 158, 255, 0.1);
}
</style> 
