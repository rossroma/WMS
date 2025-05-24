<template>
  <div class="dashboard-container">
    <!-- 数据概览卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>今日入库</span>
              <el-tag type="success">实时</el-tag>
            </div>
          </template>
          <div class="card-body">
            <div class="number">{{ statistics.todayInbound }}</div>
            <div class="text">件</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>今日出库</span>
              <el-tag type="warning">实时</el-tag>
            </div>
          </template>
          <div class="card-body">
            <div class="number">{{ statistics.todayOutbound }}</div>
            <div class="text">件</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>库存预警</span>
              <el-tag type="danger">实时</el-tag>
            </div>
          </template>
          <div class="card-body">
            <div class="number">{{ statistics.stockWarning }}</div>
            <div class="text">个商品</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>盘点准确率</span>
              <el-tag type="info">实时</el-tag>
            </div>
          </template>
          <div class="card-body">
            <div class="number">{{ statistics.stocktakingAccuracy }}%</div>
            <div class="text">准确率</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>近7天出入库趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <!-- 这里需要集成图表库，如ECharts -->
            <div class="chart-placeholder">出入库趋势图表</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>畅销商品TOP10</span>
            </div>
          </template>
          <div class="chart-container">
            <!-- 这里需要集成图表库，如ECharts -->
            <div class="chart-placeholder">畅销商品图表</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 预警商品列表 -->
    <el-card class="warning-card">
      <template #header>
        <div class="card-header">
          <span>库存预警商品</span>
          <el-button type="primary" link>查看全部</el-button>
        </div>
      </template>
      <el-table :data="warningProducts" style="width: 100%">
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="specification" label="规格" />
        <el-table-column prop="currentStock" label="当前库存" />
        <el-table-column prop="warningStock" label="预警库存" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag type="danger">库存不足</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleInbound(row)">
              入库
            </el-button>
            <el-button type="primary" link @click="handleDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 统计数据
const statistics = reactive({
  todayInbound: 0,
  todayOutbound: 0,
  stockWarning: 0,
  stocktakingAccuracy: 0
})

// 预警商品列表
const warningProducts = ref([])

// 获取统计数据
const getStatistics = async () => {
  try {
    // TODO: 调用后端API获取统计数据
    // 模拟数据
    statistics.todayInbound = 156
    statistics.todayOutbound = 89
    statistics.stockWarning = 12
    statistics.stocktakingAccuracy = 99.8
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取预警商品
const getWarningProducts = async () => {
  try {
    // TODO: 调用后端API获取预警商品
    // 模拟数据
    warningProducts.value = [
      {
        id: 1,
        name: '商品A',
        specification: '500ml/瓶',
        currentStock: 5,
        warningStock: 10
      },
      {
        id: 2,
        name: '商品B',
        specification: '1kg/袋',
        currentStock: 3,
        warningStock: 8
      }
    ]
  } catch (error) {
    console.error('获取预警商品失败:', error)
  }
}

// 处理入库
const handleInbound = (row) => {
  router.push({
    path: '/inbound',
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

onMounted(() => {
  getStatistics()
  getWarningProducts()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.data-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-body {
  text-align: center;
  padding: 20px 0;
}

.number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.text {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 400px;
}

.chart-container {
  height: 320px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-placeholder {
  color: #909399;
  font-size: 14px;
}

.warning-card {
  margin-bottom: 20px;
}
</style> 