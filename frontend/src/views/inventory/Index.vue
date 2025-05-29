<template>
  <ListPageLayout>
    <template #filter>
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="商品名称">
          <el-input v-model="queryParams.productName" placeholder="请输入商品名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
          <el-button type="success" @click="handleViewLogs">
            <el-icon><List /></el-icon>库存流水
          </el-button>
        </el-form-item>
      </el-form>
    </template>

    <template #content>
      <el-table
        v-loading="loading"
        :data="inventoryList"
        border
        style="width: 100%"
      >
        <el-table-column type="index" width="50" />
        <el-table-column prop="Product.name" label="商品名称" min-width="150">
          <template #default="{ row }">
            {{ row.Product?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="Product.code" label="商品编码" min-width="120">
          <template #default="{ row }">
            {{ row.Product?.code || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="Product.brand" label="品牌" min-width="100">
          <template #default="{ row }">
            {{ row.Product?.brand || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="Product.specification" label="规格" min-width="120">
          <template #default="{ row }">
            {{ row.Product?.specification || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="Product.unit" label="单位" width="80">
          <template #default="{ row }">
            {{ row.Product?.unit || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="当前库存" width="100">
          <template #default="{ row }">
            <span :class="{ 'warning-stock': isWarningStock(row) }">
              {{ row.quantity || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="Product.stockAlertQuantity" label="预警库存" width="100">
          <template #default="{ row }">
            {{ row.Product?.stockAlertQuantity || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="库存状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStockStatusType(row)">
              {{ getStockStatusText(row) }}
            </el-tag>
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
import { useRouter } from 'vue-router'
import { getInventoryList } from '@/api/inventory'
import ListPageLayout from '@/components/ListPageLayout.vue'

const router = useRouter()

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 20,
  productName: ''
})

// 数据列表
const loading = ref(false)
const inventoryList = ref([])
const total = ref(0)

// 获取库存列表
const fetchInventoryList = async() => {
  loading.value = true
  try {
    const res = await getInventoryList(queryParams)
    inventoryList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取库存列表失败:', error)
    // 移除重复的错误提示，request.js中已经统一处理
  } finally {
    loading.value = false
  }
}

// 判断是否为预警库存
const isWarningStock = (row) => {
  const quantity = row.quantity || 0
  const alertQuantity = row.Product?.stockAlertQuantity || 0
  return alertQuantity > 0 && quantity <= alertQuantity
}

// 获取库存状态类型
const getStockStatusType = (row) => {
  const quantity = row.quantity || 0
  if (quantity <= 0) return 'danger'
  if (isWarningStock(row)) return 'warning'
  return 'success'
}

// 获取库存状态文本
const getStockStatusText = (row) => {
  const quantity = row.quantity || 0
  if (quantity <= 0) return '无库存'
  if (isWarningStock(row)) return '库存预警'
  return '库存正常'
}

// 查询按钮
const handleQuery = () => {
  queryParams.page = 1
  fetchInventoryList()
}

// 重置按钮
const resetQuery = () => {
  queryParams.productName = ''
  queryParams.page = 1
  fetchInventoryList()
}

// 查看库存流水
const handleViewLogs = () => {
  router.push('/inventory/logs')
}

// 分页相关
const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.page = 1
  fetchInventoryList()
}

const handleCurrentChange = (val) => {
  queryParams.page = val
  fetchInventoryList()
}

onMounted(() => {
  fetchInventoryList()
})
</script>

<style scoped>
.warning-stock {
  color: #e6a23c;
  font-weight: bold;
}
</style> 
