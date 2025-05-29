<template>
  <ListPageLayout>
    <template #filter>
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="消息类型">
          <el-select 
            v-model="queryParams.type" 
            placeholder="请选择类型" 
            clearable
            style="width: 140px"
          >
            <el-option 
              v-for="item in messageTypes" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="阅读状态">
          <el-select 
            v-model="queryParams.isRead" 
            placeholder="请选择状态" 
            clearable
            style="width: 120px"
          >
            <el-option label="未读" value="false" />
            <el-option label="已读" value="true" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
          <el-button 
            type="success" 
            @click="handleMarkAllRead"
            :disabled="unreadCount === 0"
          >
            <el-icon><Check /></el-icon>全部已读
          </el-button>
        </el-form-item>
      </el-form>
    </template>

    <template #content>
      <div class="message-stats" v-if="total > 0">
        <el-alert
          :title="`共 ${total} 条消息，其中 ${unreadCount} 条未读`"
          type="info"
          :closable="false"
          show-icon
        />
      </div>

      <el-table
        v-loading="loading"
        :data="messageList"
        border
        style="width: 100%"
        :row-class-name="getRowClassName"
      >
        <el-table-column type="index" width="50" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag 
              :type="row.isRead ? 'success' : 'warning'" 
              size="small"
            >
              {{ row.isRead ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getMessageTypeColor(row.type)" 
              size="small"
            >
              {{ getMessageTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="消息内容" min-width="300">
          <template #default="{ row }">
            <div class="message-content">
              {{ row.content }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="relatedId" label="关联单据" width="180">
          <template #default="{ row }">
            <span v-if="row.relatedId" class="related-id">
              {{ row.relatedId }}
            </span>
            <span v-else class="no-related">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="!row.isRead"
              type="primary" 
              link 
              @click="handleMarkRead(row)"
            >
              标记已读
            </el-button>
            <span v-else class="read-status">已读</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </template>
  </ListPageLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMessageList, markAsRead, markAllAsRead } from '@/api/message'
import ListPageLayout from '@/components/ListPageLayout.vue'
import { formatDateTime } from '@/utils/date'

// 消息类型选项
const messageTypes = [
  { label: '库存预警', value: 'INVENTORY_ALERT' },
  { label: '盘盈入库', value: 'STOCK_IN' },
  { label: '盘亏出库', value: 'STOCK_OUT' }
]

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

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 20,
  type: '',
  isRead: '',
  startDate: '',
  endDate: ''
})

// 数据列表
const loading = ref(false)
const messageList = ref([])
const total = ref(0)
const dateRange = ref([])

// 计算未读消息数量
const unreadCount = computed(() => {
  return messageList.value.filter(msg => !msg.isRead).length
})

// 获取消息类型文本
const getMessageTypeText = (type) => {
  return messageTypeMap[type] || type
}

// 获取消息类型颜色
const getMessageTypeColor = (type) => {
  return messageTypeColorMap[type] || 'info'
}

// 获取消息列表
const getList = async() => {
  loading.value = true
  try {
    const res = await getMessageList(queryParams)
    messageList.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取消息列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 查询按钮
const handleQuery = () => {
  queryParams.page = 1
  getList()
}

// 重置按钮
const resetQuery = () => {
  queryParams.type = ''
  queryParams.isRead = ''
  queryParams.startDate = ''
  queryParams.endDate = ''
  dateRange.value = []
  handleQuery()
}

// 处理日期范围变化
const handleDateChange = (dates) => {
  if (dates && dates.length === 2) {
    queryParams.startDate = dates[0]
    queryParams.endDate = dates[1]
  } else {
    queryParams.startDate = ''
    queryParams.endDate = ''
  }
}

// 标记单条消息为已读
const handleMarkRead = async(row) => {
  try {
    await markAsRead(row.id)
    row.isRead = true
    ElMessage.success('消息已标记为已读')
  } catch (error) {
    console.error('标记消息已读失败:', error)
  }
}

// 标记所有消息为已读
const handleMarkAllRead = async() => {
  if (unreadCount.value === 0) {
    ElMessage.info('没有未读消息')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认要将所有 ${unreadCount.value} 条未读消息标记为已读吗？`,
      '确认操作',
      {
        type: 'warning'
      }
    )

    await markAllAsRead()
    messageList.value.forEach(msg => {
      msg.isRead = true
    })
    ElMessage.success('所有消息已标记为已读')
  } catch (error) {
    console.error('标记所有消息已读失败:', error)
  }
}

// 分页相关
const handleSizeChange = (val) => {
  queryParams.pageSize = val
  getList()
}

const handleCurrentChange = (val) => {
  queryParams.page = val
  getList()
}

// 获取行样式类名
const getRowClassName = ({ row }) => {
  return row.isRead ? '' : 'unread-row'
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.message-stats {
  margin-bottom: 16px;
}

.message-content {
  line-height: 1.4;
  word-break: break-word;
}

.read-status {
  color: #909399;
  font-size: 12px;
}

.related-id {
  color: #409eff;
  font-weight: 500;
  font-family: 'Courier New', monospace;
}

.no-related {
  color: #c0c4cc;
}

:deep(.unread-row) {
  background-color: #f0f9ff;
}

:deep(.unread-row:hover) {
  background-color: #e6f7ff !important;
}
</style> 
