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
            <div class="number">{{ dashboardData.todayInbound || 0 }}</div>
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
            <div class="number">{{ dashboardData.todayOutbound || 0 }}</div>
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
            <div class="number">{{ dashboardData.stockWarning || 0 }}</div>
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
            <div class="number">{{ dashboardData.stocktakingAccuracy || 100 }}%</div>
            <div class="text">准确率</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第二行统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>库存总量</span>
              <el-tag type="primary">实时</el-tag>
            </div>
          </template>
          <div class="card-body">
            <div class="number">{{ dashboardData.totalInventory || 0 }}</div>
            <div class="text">件</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>商品种类</span>
              <el-tag type="primary">实时</el-tag>
            </div>
          </template>
          <div class="card-body">
            <div class="number">{{ dashboardData.productCount || 0 }}</div>
            <div class="text">种</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>库存价值</span>
              <el-tag type="primary">实时</el-tag>
            </div>
          </template>
          <div class="card-body">
            <div class="number">¥{{ formatNumber(dashboardData.inventoryValue || 0) }}</div>
            <div class="text">总价值</div>
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
              <el-button type="primary" link @click="refreshTrendChart">刷新</el-button>
            </div>
          </template>
          <div class="chart-container">
            <div ref="trendChart" class="chart" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>热门商品TOP10</span>
              <el-button type="primary" link @click="refreshHotProducts">刷新</el-button>
            </div>
          </template>
          <div class="chart-container">
            <div ref="hotProductsChart" class="chart" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 预警商品列表 -->
    <el-card class="warning-card">
      <template #header>
        <div class="card-header">
          <span>库存预警商品</span>
          <el-button type="primary" link @click="handleViewAllWarnings">查看全部</el-button>
        </div>
      </template>
      <el-table 
        :data="warningProducts" 
        style="width: 100%"
        v-loading="warningLoading"
        empty-text="暂无预警商品"
      >
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="code" label="商品编码" />
        <el-table-column prop="specification" label="规格" />
        <el-table-column prop="currentStock" label="当前库存" />
        <el-table-column prop="warningStock" label="预警库存" />
        <el-table-column prop="status" label="状态">
          <template #default>
            <el-tag type="danger">库存不足</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleInbound(row)">
              补货
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { 
  getDashboardData, 
  getWeeklyTrend, 
  getHotProducts, 
  getWarningProducts 
} from '@/api/dashboard'
// import { ElMessage } from 'element-plus'

const router = useRouter()

// 数据状态 - 修改为使用 ref
const dashboardData = ref({ 
  todayInbound: 0,
  todayOutbound: 0,
  stockWarning: 0,
  stocktakingAccuracy: 100,
  totalInventory: 0,
  productCount: 0,
  inventoryValue: 0
})

// 预警商品列表 (保持 ref)
const warningProducts = ref([])
const warningLoading = ref(false)

// 图表引用 (保持 ref)
const trendChart = ref(null)
const hotProductsChart = ref(null)
let trendChartInstance = null
let hotProductsChartInstance = null

// 格式化数字
const formatNumber = (num) => {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)  }万`
  }
  return num.toLocaleString()
}

// 获取dashboard数据 - 修改赋值方式
const getDashboard = async() => {
  try {
    const response = await getDashboardData()
    dashboardData.value = response.data
  } catch (error) {
    console.error('获取dashboard数据失败:', error)
  }
}

// 获取预警商品
const getWarningProductsList = async() => {
  try {
    warningLoading.value = true
    const response = await getWarningProducts()
    warningProducts.value = response.data
  } catch (error) {
    console.error('获取预警商品失败:', error)
  } finally {
    warningLoading.value = false
  }
}

// 初始化趋势图表
const initTrendChart = async() => {
  try {
    const response = await getWeeklyTrend()
    const data = response.data
    
    if (trendChartInstance) {
      trendChartInstance.dispose()
    }
    
    trendChartInstance = echarts.init(trendChart.value)
    
    const option = {
      title: {
        text: '出入库趋势',
        left: 'center',
        textStyle: {
          fontSize: 14
        }
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['入库', '出库'],
        bottom: 10
      },
      xAxis: {
        type: 'category',
        data: data.map(item => {
          const date = new Date(item.date)
          return `${date.getMonth() + 1}/${date.getDate()}`
        })
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '入库',
          type: 'line',
          data: data.map(item => item.inbound),
          smooth: true,
          itemStyle: {
            color: '#67C23A'
          }
        },
        {
          name: '出库',
          type: 'line',
          data: data.map(item => item.outbound),
          smooth: true,
          itemStyle: {
            color: '#E6A23C'
          }
        }
      ]
    }
    
    trendChartInstance.setOption(option)
  } catch (error) {
    console.error('获取趋势数据失败:', error)
  }
}

// 初始化热门商品图表
const initHotProductsChart = async() => {
  try {
    const response = await getHotProducts()
    const data = response.data
    
    if (hotProductsChartInstance) {
      hotProductsChartInstance.dispose()
    }
    
    hotProductsChartInstance = echarts.init(hotProductsChart.value)
    
    const option = {
      title: {
        text: '热门商品',
        left: 'center',
        textStyle: {
          fontSize: 14
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      xAxis: {
        type: 'value'
      },
      yAxis: {
        type: 'category',
        data: data.map(item => item.product.name).reverse(),
        axisLabel: {
          interval: 0,
          formatter(value) {
            return value.length > 6 ? `${value.substring(0, 6)  }...` : value
          }
        }
      },
      series: [
        {
          name: '库存量',
          type: 'bar',
          data: data.map(item => item.quantity).reverse(),
          itemStyle: {
            color: '#409EFF'
          }
        }
      ]
    }
    
    hotProductsChartInstance.setOption(option)
  } catch (error) {
    console.error('获取热门商品数据失败:', error)
  }
}

// 刷新趋势图表
const refreshTrendChart = () => {
  initTrendChart()
}

// 刷新热门商品
const refreshHotProducts = () => {
  initHotProductsChart()
}

// 处理入库
const handleInbound = (row) => {
  router.push({
    path: '/warehouse/inbound',
    query: { 
      productId: row.id,
      action: 'create'
    }
  })
}

// 查看所有预警
const handleViewAllWarnings = () => {
  router.push({
    path: '/inventory/list',
    query: { warning: true }
  })
}

// 窗口大小变化时重新调整图表
const handleResize = () => {
  if (trendChartInstance) {
    trendChartInstance.resize()
  }
  if (hotProductsChartInstance) {
    hotProductsChartInstance.resize()
  }
}

onMounted(async() => {
  await getDashboard()
  await getWarningProductsList()
  
  await nextTick()
  
  // 初始化图表
  initTrendChart()
  initHotProductsChart()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (trendChartInstance) {
    trendChartInstance.dispose()
  }
  if (hotProductsChartInstance) {
    hotProductsChartInstance.dispose()
  }
  window.removeEventListener('resize', handleResize)
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

.chart {
  width: 100%;
  height: 100%;
}

.warning-card {
  margin-bottom: 20px;
}
</style> 
