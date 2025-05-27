<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="盘点明细"
    width="1200px"
    :before-close="handleClose"
    destroy-on-close
  >
    <!-- 盘点单信息 -->
    <div class="order-info" v-if="orderInfo">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="盘点单号">{{ orderInfo.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="盘点日期">{{ formatDateTime(orderInfo.stocktakingDate) }}</el-descriptions-item>
        <el-descriptions-item label="操作员">
          <UserDisplay :value="orderInfo.operator" />
        </el-descriptions-item>
        <el-descriptions-item label="盘点商品数">{{ orderInfo.totalItems }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ orderInfo.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 商品明细列表 -->
    <div class="items-section">
      <div class="section-header">
        <h4>盘点商品明细</h4>
        <div class="summary">
          <span>总计：{{ total }} 个商品</span>
          <span class="profit-count">盘盈：{{ profitCount }} 个</span>
          <span class="loss-count">盘亏：{{ lossCount }} 个</span>
        </div>
      </div>
      
      <el-table
        v-loading="loading"
        :data="itemsList"
        border
        style="width: 100%"
        max-height="400px"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="商品信息" min-width="200">
          <template #default="{ row }">
            <div class="product-info">
              <div class="product-name">{{ row.productName }}</div>
              <div class="product-code">编码：{{ row.productCode }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="specification" label="规格" width="120" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="系统库存" width="100">
          <template #default="{ row }">
            <span class="system-stock">{{ row.systemQuantity || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="实际数量" width="120">
          <template #default="{ row }">
            <span class="actual-quantity">{{ row.actualQuantity || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="差异" width="100">
          <template #default="{ row }">
            <span 
              :class="getDifferenceClass((row.actualQuantity || 0) - (row.systemQuantity || 0))"
            >
              {{ (row.actualQuantity || 0) - (row.systemQuantity || 0) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="差异类型" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getDifferenceTagType((row.actualQuantity || 0) - (row.systemQuantity || 0))"
              size="small"
            >
              {{ getDifferenceText((row.actualQuantity || 0) - (row.systemQuantity || 0)) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getStocktakingItems } from '@/api/stocktaking'
import { formatDateTime } from '@/utils/date'
import UserDisplay from '@/components/UserDisplay.vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  stocktakingOrderId: {
    type: [String, Number],
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// 响应式数据
const loading = ref(false)

// 盘点单信息
const orderInfo = ref(null)

// 商品明细数据
const itemsList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 计算属性
const profitCount = computed(() => {
  return itemsList.value.filter(item => 
    (item.actualQuantity || 0) > (item.systemQuantity || 0)
  ).length
})

const lossCount = computed(() => {
  return itemsList.value.filter(item => 
    (item.actualQuantity || 0) < (item.systemQuantity || 0)
  ).length
})

// 监听弹窗打开
watch(() => props.modelValue, (newVal) => {
  if (newVal && props.stocktakingOrderId) {
    fetchItems()
  }
})

// 获取盘点明细
const fetchItems = async () => {
  if (!props.stocktakingOrderId) return
  
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    const res = await getStocktakingItems(props.stocktakingOrderId, params)
    orderInfo.value = res.data.orderInfo
    itemsList.value = res.data.items
    total.value = res.data.total
  } catch (error) {
    console.error('获取盘点明细失败:', error)
    ElMessage.error('获取盘点明细失败')
  }
  loading.value = false
}

// 获取差异样式类
const getDifferenceClass = (difference) => {
  if (difference > 0) return 'profit'
  if (difference < 0) return 'loss'
  return 'normal'
}

// 获取差异标签类型
const getDifferenceTagType = (difference) => {
  if (difference > 0) return 'success'
  if (difference < 0) return 'danger'
  return 'info'
}

// 获取差异文本
const getDifferenceText = (difference) => {
  if (difference > 0) return '盘盈'
  if (difference < 0) return '盘亏'
  return '正常'
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchItems()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchItems()
}

// 关闭弹窗
const handleClose = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.order-info {
  margin-bottom: 20px;
}

.items-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h4 {
  margin: 0;
  color: #303133;
}

.summary {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #606266;
}

.profit-count {
  color: #67c23a;
}

.loss-count {
  color: #f56c6c;
}

.product-info {
  line-height: 1.4;
}

.product-name {
  font-weight: 500;
  color: #303133;
}

.product-code {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.system-stock {
  color: #606266;
  font-weight: 500;
}

.actual-quantity {
  color: #303133;
  font-weight: 500;
}

.profit {
  color: #67c23a;
  font-weight: 500;
}

.loss {
  color: #f56c6c;
  font-weight: 500;
}

.normal {
  color: #606266;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  text-align: right;
}
</style> 