<template>
  <BaseDialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="1200px"
    :show-footer="false"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #form>
      <!-- 订单基本信息 -->
      <div class="order-info" v-if="orderInfo">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="单据号">{{ orderInfo.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="类型" v-if="orderType !== 'purchase'">{{ getTypeText(orderInfo.type) }}</el-descriptions-item>
          <el-descriptions-item label="状态" v-if="orderType === 'purchase'">{{ getTypeText(orderInfo.status) }}</el-descriptions-item>
          <el-descriptions-item label="日期">{{ formatDateTime(orderInfo.orderDate) }}</el-descriptions-item>
          <el-descriptions-item label="操作员">{{ orderInfo.operator }}</el-descriptions-item>
          <el-descriptions-item label="总数量">{{ orderInfo.totalQuantity }}</el-descriptions-item>
          <el-descriptions-item label="总金额">¥{{ Number(orderInfo.totalAmount || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="3">{{ orderInfo.remark || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 商品列表 -->
      <div class="items-section">
        <h4 class="section-title">关联商品明细</h4>
        <el-table
          v-loading="loading"
          :data="items"
          border
          style="width: 100%"
        >
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="商品信息" min-width="200">
            <template #default="{ row }">
              <div class="product-info">
                <div class="product-name">{{ getProductName(row) }}</div>
                <div class="product-code">编码：{{ getProductCode(row) }}</div>
                <div class="product-brand" v-if="getProductBrand(row)">品牌：{{ getProductBrand(row) }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="规格" width="120">
            <template #default="{ row }">
              {{ getProductSpecification(row) }}
            </template>
          </el-table-column>
          <el-table-column label="单位" width="80">
            <template #default="{ row }">
              {{ getProductUnit(row) }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="100" />
          <el-table-column label="单价" width="100">
            <template #default="{ row }">
              ¥{{ Number(getUnitPrice(row)).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              ¥{{ Number(getTotalPrice(row)).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination" v-if="total > 0">
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

        <!-- 空状态 -->
        <div class="empty-state" v-if="!loading && items.length === 0">
          <el-empty description="暂无关联商品" />
        </div>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import BaseDialog from '@/components/BaseDialog.vue'
import { formatDateTime } from '@/utils/date'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  orderType: {
    type: String,
    required: true,
    validator: (value) => ['inbound', 'outbound', 'purchase'].includes(value)
  },
  orderId: {
    type: [String, Number],
    default: null
  },
  getItemsApi: {
    type: Function,
    required: true
  },
  typeMap: {
    type: Object,
    required: true
  }
})

const _emit = defineEmits(['update:modelValue'])

// 数据
const loading = ref(false)
const orderInfo = ref(null)
const items = ref([])
const total = ref(0)

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 20
})

// 计算属性
const dialogTitle = computed(() => {
  const typeText = props.orderType === 'inbound' ? '入库单' : 
                   props.orderType === 'outbound' ? '出库单' : '采购订单'
  return `${typeText}关联商品`
})

// 获取类型文本
const getTypeText = (type) => {
  return props.typeMap[type] || type
}

// 获取商品名称（兼容不同数据结构）
const getProductName = (row) => {
  return row.Product?.name || row.product?.name || ''
}

// 获取商品编码（兼容不同数据结构）
const getProductCode = (row) => {
  return row.Product?.code || row.product?.code || ''
}

// 获取商品品牌（兼容不同数据结构）
const getProductBrand = (row) => {
  return row.Product?.brand || row.product?.brand || ''
}

// 获取规格（兼容不同数据结构）
const getProductSpecification = (row) => {
  return row.Product?.specification || row.product?.specification || ''
}

// 获取单位（兼容不同数据结构）
const getProductUnit = (row) => {
  return row.Product?.unit || row.product?.unit || ''
}

// 获取单价（兼容不同数据结构）
const getUnitPrice = (row) => {
  return row.unitPrice || row.unit_price || 0
}

// 获取总价（兼容不同数据结构）
const getTotalPrice = (row) => {
  return row.totalPrice || row.total_price || 0
}

// 获取关联商品列表
const getItemsList = async() => {
  if (!props.orderId) return
  
  loading.value = true
  try {
    const res = await props.getItemsApi(props.orderId, queryParams)
    orderInfo.value = res.data.orderInfo
    items.value = res.data.items
    total.value = res.data.total
  } catch (_error) {
    console.error('获取关联商品失败:', _error)
    // 移除重复的错误提示，request.js中已经统一处理
  } finally {
    loading.value = false
  }
}

// 分页事件
const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.page = 1
  getItemsList()
}

const handleCurrentChange = (val) => {
  queryParams.page = val
  getItemsList()
}

// 监听弹窗显示状态
watch(() => props.modelValue, (newVal) => {
  if (newVal && props.orderId) {
    // 重置分页参数
    queryParams.page = 1
    queryParams.pageSize = 20
    getItemsList()
  }
})

// 监听订单ID变化
watch(() => props.orderId, (newVal) => {
  if (newVal && props.modelValue) {
    queryParams.page = 1
    getItemsList()
  }
})
</script>

<style scoped>
.order-info {
  margin-bottom: 20px;
}

.items-section {
  margin-top: 20px;
}

.section-title {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.product-info {
  .product-name {
    font-weight: 500;
    color: #303133;
    margin-bottom: 4px;
  }
  
  .product-code,
  .product-brand {
    font-size: 12px;
    color: #909399;
    margin-bottom: 2px;
  }
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}
</style> 
