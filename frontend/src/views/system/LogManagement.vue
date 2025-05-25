<template>
  <div class="log-management-container list-page-layout">
    <!-- Filter Section -->
    <div class="filter-section">
      <el-card class="filter-card" shadow="never">
        <el-form :inline="true" :model="queryParams" class="filter-form" @submit.prevent="handleQuery">
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
            <el-select v-model="queryParams.module" placeholder="选择模块" clearable style="width: 150px" @change="handleQuery">
              <el-option v-for="item in filterOptions.modules" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作类型">
            <el-select v-model="queryParams.actionType" placeholder="选择类型" clearable style="width: 150px" @change="handleQuery">
              <el-option v-for="item in filterOptions.actionTypes" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="queryParams.username" placeholder="输入用户名" clearable style="width: 150px" @keyup.enter="handleQuery" />
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
      </el-card>
    </div>

    <!-- Content Section -->
    <div class="content-section">
      <el-card class="table-card" shadow="never">
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
              <el-popover trigger="hover" placement="top" width="400" :content="row.details">
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

        <div class="pagination-container" v-if="total > 0">
          <el-pagination
            v-model:current-page="queryParams.page"
            v-model:page-size="queryParams.limit" 
            :page-sizes="[15, 30, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getLogs, getLogFilterOptions } from '@/api/log';
import { formatDate } from '@/utils/date'; // 路径已确认正确
import { Search, Refresh } from '@element-plus/icons-vue'; // 导入图标

// State
const loading = ref(true);
const logList = ref([]);
const total = ref(0);
const dateRange = ref([]);

const queryParams = reactive({
  page: 1,
  limit: 15,
  startDate: null,
  endDate: null,
  module: null,
  username: null,
  actionType: null,
});

const filterOptions = reactive({
  modules: [],
  actionTypes: [],
});

// Utils
const formatDateTime = (time) => {
  if (!time) return '';
  return formatDate(time, 'YYYY-MM-DD HH:mm:ss');
};

const truncateText = (value, length) => {
  if (!value) return '';
  if (value.length <= length) {
    return value;
  }
  return value.substring(0, length) + '...';
};

// API Calls
const fetchLogList = async () => {
  loading.value = true;
  try {
    const params = { ...queryParams };
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    } else {
      params.startDate = null;
      params.endDate = null;
    }
    // 清理queryParams中无效的日期参数，因为它们已合并到params中
    delete params.dateRange; 


    const response = await getLogs(params);
    logList.value = response.data;
    total.value = response.total;
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    // 在这里可以添加用户提示，例如使用 ElMessage
  } finally {
    loading.value = false;
  }
};

const fetchFilterOpts = async () => {
  try {
    const response = await getLogFilterOptions();
    filterOptions.modules = response.data.modules || [];
    filterOptions.actionTypes = response.data.actionTypes || [];
  } catch (error) {
    console.error("Failed to fetch filter options:", error);
  }
};

// Event Handlers
const handleQuery = () => {
  queryParams.page = 1;
  fetchLogList();
};

const resetQuery = () => {
  queryParams.page = 1;
  queryParams.module = null;
  queryParams.username = null;
  queryParams.actionType = null;
  queryParams.startDate = null; // 也重置 queryParams 中的日期
  queryParams.endDate = null;
  dateRange.value = []; // 清空日期选择器的绑定值
  fetchLogList();
};

const handleDateRangeChange = (newRange) => {
  // dateRange.value 已经通过 v-model 更新
  // 在 handleQuery 或 fetchLogList 中会使用 dateRange.value
  // 为了立即生效，可以调用 handleQuery
  handleQuery();
};

const handleSizeChange = (newSize) => {
  queryParams.limit = newSize;
  fetchLogList();
};

const handleCurrentChange = (newPage) => {
  queryParams.page = newPage;
  fetchLogList();
};

// Lifecycle Hooks
onMounted(() => {
  fetchLogList();
  fetchFilterOpts();
});

</script>

<style scoped lang="scss">
.list-page-layout {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-section {
  // 如果ListPageLayout有特定样式，这里可以留空或添加补充样式
}

.filter-card {
  .filter-form {
    display: flex;
    flex-wrap: wrap;
    gap: 10px; 
    .el-form-item {
      margin-bottom: 0; 
    }
  }
}

.content-section {
 // 如果ListPageLayout有特定样式，这里可以留空或添加补充样式
}

.table-card {
  // 表格卡片的特定样式
}

.details-popover-reference {
  cursor: pointer;
  color: var(--el-color-primary);
  &:hover {
    text-decoration: underline;
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style> 