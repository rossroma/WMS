<template>
  <div class="inventory-container">
    <div class="header">
      <h2>库存查询</h2>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="商品名称">
          <el-input v-model="queryParams.name" placeholder="请输入商品名称" clearable />
        </el-form-item>
        <el-form-item label="商品分类">
          <el-select v-model="queryParams.categoryId" placeholder="请选择分类" clearable>
            <el-option
              v-for="item in categories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="库存状态">
          <el-select v-model="queryParams.stockStatus" placeholder="请选择状态" clearable>
            <el-option label="库存充足" value="normal" />
            <el-option label="库存不足" value="warning" />
            <el-option label="无库存" value="empty" />
          </el-select>
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

    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="inventoryList"
        border
        style="width: 100%"
      >
        <el-table-column type="index" width="50" />
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="categoryName" label="商品分类" />
        <el-table-column prop="specification" label="规格" />
        <el-table-column prop="unit" label="单位" />
        <el-table-column prop="currentStock" label="当前库存" />
        <el-table-column prop="warningStock" label="预警库存" />
        <el-table-column prop="status" label="库存状态">
          <template #default="{ row }">
            <el-tag :type="getStockStatusType(row)">
              {{ getStockStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleInbound(row)">
              入库
            </el-button>
            <el-button type="primary" link @click="handleOutbound(row)">
              出库
            </el-button>
            <el-button type="primary" link @click="handleDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getCategories } from '@/api/product'

const router = useRouter()

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  name: '',
  categoryId: undefined,
  stockStatus: undefined
})

// 数据列表
const loading = ref(false)
const inventoryList = ref([])
const total = ref(0)
const categories = ref([])

// 获取库存列表
const getList = async () => {
  loading.value = true
  try {
    // TODO: 调用后端API获取库存列表
    // 模拟数据
    inventoryList.value = [
      {
        id: 1,
        name: '商品A',
        categoryName: '食品',
        specification: '500ml/瓶',
        unit: '瓶',
        currentStock: 100,
        warningStock: 50
      },
      {
        id: 2,
        name: '商品B',
        categoryName: '饮料',
        specification: '1kg/袋',
        unit: '袋',
        currentStock: 20,
        warningStock: 30
      }
    ]
    total.value = 2
  } catch (error) {
    console.error('获取库存列表失败:', error)
  }
  loading.value = false
}

// 获取分类列表
const getCategoryList = async () => {
  try {
    const res = await getCategories()
    categories.value = res.data
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 获取库存状态类型
const getStockStatusType = (row) => {
  if (row.currentStock <= 0) return 'danger'
  if (row.currentStock < row.warningStock) return 'warning'
  return 'success'
}

// 获取库存状态文本
const getStockStatusText = (row) => {
  if (row.currentStock <= 0) return '无库存'
  if (row.currentStock < row.warningStock) return '库存不足'
  return '库存充足'
}

// 查询按钮
const handleQuery = () => {
  queryParams.page = 1
  getList()
}

// 重置按钮
const resetQuery = () => {
  queryParams.name = ''
  queryParams.categoryId = undefined
  queryParams.stockStatus = undefined
  handleQuery()
}

// 入库按钮
const handleInbound = (row) => {
  router.push({
    path: '/inbound',
    query: { productId: row.id }
  })
}

// 出库按钮
const handleOutbound = (row) => {
  router.push({
    path: '/outbound',
    query: { productId: row.id }
  })
}

// 查看详情
const handleDetail = (row) => {
  router.push({
    path: '/products',
    query: { id: row.id }
  })
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

onMounted(() => {
  getList()
  getCategoryList()
})
</script>

<style scoped>
.inventory-container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 