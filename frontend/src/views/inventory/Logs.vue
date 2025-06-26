<template>
  <ListPageLayout>
    <template #filter>
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="商品名称">
          <el-input v-model="queryParams.productName" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select 
            v-model="queryParams.type" 
            placeholder="请选择类型" 
            clearable
            size="default"
            style="width: 120px"
          >
            <el-option label="入库" value="inbound" />
            <el-option label="出库" value="outbound" />
            <el-option label="盘点" value="stocktaking" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作员">
          <el-select 
            v-model="queryParams.operator" 
            placeholder="请选择操作员" 
            clearable
            filterable
            size="default"
            style="width: 150px"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.fullname"
              :value="user.username"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </template>

    <template #content>
      <el-table
        v-loading="loading"
        :data="logsList"
        border
        style="width: 100%"
      >
        <el-table-column type="index" width="50" />
        <el-table-column prop="inventory.Product.name" label="商品名称" min-width="150">
          <template #default="{ row }">
            {{ row.inventory?.Product?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="inventory.Product.code" label="商品编码" min-width="120">
          <template #default="{ row }">
            {{ row.inventory?.Product?.code || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="changeQuantity" label="变动数量" width="120">
          <template #default="{ row }">
            <span :class="getQuantityClass(row.changeQuantity)">
              {{ formatQuantity(row.changeQuantity) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="操作时间" min-width="160">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作员" width="110">
          <template #default="{ row }">
            <UserDisplay :value="row.operator" />
          </template>
        </el-table-column>
        <el-table-column prop="relatedDocument" label="相关单据" min-width="120">
          <template #default="{ row }">
            {{ row.relatedDocument || '-' }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </template>
  </ListPageLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getInventoryLogs } from '@/api/inventory'
import { formatDateTime } from '@/utils/date'
import ListPageLayout from '@/components/ListPageLayout.vue'
import UserDisplay from '@/components/UserDisplay.vue'
import { useUsers } from '@/composables/useUsers'

// 使用用户数据composable
const { userList, getAllUsers } = useUsers()

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 20,
  productName: '',
  type: '',
  operator: '',
  startDate: '',
  endDate: ''
})

// 数据列表
const loading = ref(false)
const logsList = ref([])
const total = ref(0)
const dateRange = ref([])

// 获取库存流水列表
const getLogsList = async() => {
  loading.value = true
  try {
    const res = await getInventoryLogs(queryParams)
    logsList.value = res.data.list
    total.value = res.data.total
  } catch (_error) {
    console.error('获取库存流水失败:', _error)
    // 移除重复的错误提示，request.js中已经统一处理
  } finally {
    loading.value = false
  }
}

// 获取操作类型标签样式
const getTypeTagType = (type) => {
  const typeMap = {
    'inbound': 'success',
    'outbound': 'warning',
    'stocktaking': 'info'
  }
  return typeMap[type] || 'info'
}

// 获取操作类型文本
const getTypeText = (type) => {
  const typeMap = {
    'inbound': '入库',
    'outbound': '出库',
    'stocktaking': '盘点'
  }
  return typeMap[type] || type
}

// 获取数量样式类
const getQuantityClass = (quantity) => {
  if (quantity > 0) return 'quantity-positive'
  if (quantity < 0) return 'quantity-negative'
  return ''
}

// 格式化数量显示
const formatQuantity = (quantity) => {
  if (quantity > 0) return `+${quantity}`
  return quantity.toString()
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return formatDateTime(date)
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

// 查询按钮
const handleQuery = () => {
  queryParams.page = 1
  getLogsList()
}

// 重置按钮
const resetQuery = () => {
  Object.assign(queryParams, {
    productName: '',
    type: '',
    operator: '',
    startDate: '',
    endDate: '',
    page: 1
  })
  dateRange.value = []
  getLogsList()
}

// 分页相关
const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.page = 1
  getLogsList()
}

const handleCurrentChange = (val) => {
  queryParams.page = val
  getLogsList()
}

onMounted(() => {
  getLogsList()
  // 预加载用户数据，确保下拉框和UserDisplay组件能正常显示
  getAllUsers()
})
</script>

<style scoped>
.quantity-positive {
  color: #67c23a;
  font-weight: bold;
}

.quantity-negative {
  color: #f56c6c;
  font-weight: bold;
}
</style> 
