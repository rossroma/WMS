<template>
  <ListPageLayout>
    <template #filter>
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            clearable
            style="width: 240px"
            @change="handleDateRangeChange"
          />
        </el-form-item>
        <el-form-item label="操作模块">
          <el-select v-model="queryParams.module" placeholder="选择模块" clearable style="width: 120px">
            <el-option v-for="item in filterOptions.modules" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="queryParams.actionType" placeholder="选择类型" clearable style="width: 120px">
            <el-option v-for="item in filterOptions.actionTypes" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="queryParams.username" placeholder="输入用户名" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </template>

    <template #content>
      <el-table
        v-loading="loading"
        :data="logList"
        border
        fit
        highlight-current-row
        style="width: 100%;"
      >
        <el-table-column label="ID" prop="id" align="center" width="80" sortable />
        <el-table-column label="用户名" prop="username" align="center" width="150" sortable />
        <el-table-column label="操作模块" prop="module" align="center" width="180" sortable />
        <el-table-column label="操作类型" prop="actionType" align="center" width="180" sortable />
        <el-table-column label="操作详情" prop="details" align="left" min-width="250">
          <template #default="{ row }">
            <el-popover trigger="hover" placement="top" width="400" :content="row.details" :show-after="200">
              <template #reference>
                <span class="details-popover-reference">{{ truncateText(row.details, 80) }}</span>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="IP地址" prop="ipAddress" align="center" width="150" />
        <el-table-column label="操作时间" prop="createdAt" align="center" width="200" sortable>
          <template #default="{ row }">
            <span>{{ formatDateTime(row.createdAt) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination" v-if="total > 0"> 
        <el-pagination
          v-model:current-page="queryParams.page" 
          v-model:page-size="queryParams.limit"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </template>
  </ListPageLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import ListPageLayout from '@/components/ListPageLayout.vue' // 统一路径
import { getLogs, getLogFilterOptions } from '@/api/log'
import { formatDate } from '@/utils/date'
import { Search, Refresh } from '@element-plus/icons-vue'

const loading = ref(true)
const logList = ref([])
const total = ref(0)
const dateRange = ref([])

const queryParams = reactive({
  page: 1,
  limit: 20,
  startDate: null,
  endDate: null,
  module: null,
  username: null,
  actionType: null
})

const filterOptions = reactive({
  modules: [],
  actionTypes: []
})

const formatDateTime = (time) => {
  if (!time) return ''
  return formatDate(time, 'YYYY-MM-DD HH:mm:ss')
}

const truncateText = (value, length = 80) => {
  if (!value) return ''
  if (value.length <= length) {
    return value
  }
  return `${value.substring(0, length)  }...`
}

// API Calls
const fetchLogList = async() => {
  loading.value = true
  try {
    const paramsToSubmit = { ...queryParams }
    if (dateRange.value && dateRange.value.length === 2) {
      paramsToSubmit.startDate = dateRange.value[0]
      paramsToSubmit.endDate = dateRange.value[1]
    } else {
      paramsToSubmit.startDate = null
      paramsToSubmit.endDate = null
    }

    const response = await getLogs(paramsToSubmit)
    logList.value = response.data
    total.value = response.total
  } catch (error) {
    console.error('获取日志列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchFilterOpts = async() => {
  try {
    const response = await getLogFilterOptions()
    filterOptions.modules = response.data.modules || []
    filterOptions.actionTypes = response.data.actionTypes || []
  } catch (error) {
    console.error('获取筛选选项失败:', error)
  }
}

// Event Handlers
const handleQuery = () => {
  queryParams.page = 1
  fetchLogList()
}

const resetQuery = () => {
  queryParams.page = 1
  queryParams.module = null
  queryParams.username = null
  queryParams.actionType = null
  queryParams.startDate = null 
  queryParams.endDate = null
  dateRange.value = [] 
  fetchLogList()
}

const handleDateRangeChange = (_newRange) => {
  handleQuery()
}

const handleSizeChange = (newSize) => {
  queryParams.limit = newSize
  fetchLogList()
}

const handleCurrentChange = (newPage) => {
  queryParams.page = newPage
  fetchLogList()
}

onMounted(() => {
  fetchLogList()
  fetchFilterOpts()
})

</script>

<style scoped lang="scss">

.details-popover-reference {
  cursor: pointer;
  color: var(--el-color-primary);
  &:hover {
    text-decoration: underline;
  }
}
</style> 
