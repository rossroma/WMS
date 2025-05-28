<template>
  <ListPageLayout>
    <template #filter>
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="出库单号">
          <el-input v-model="queryParams.orderNo" placeholder="请输入出库单号" clearable />
        </el-form-item>
        <el-form-item label="出库类型">
          <el-select 
            v-model="queryParams.type" 
            placeholder="请选择类型" 
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="item in outboundTypes" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="出库日期">
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
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>新建出库
          </el-button>
        </el-form-item>
      </el-form>
    </template>

    <template #content>
      <el-table
        v-loading="loading"
        :data="outboundList"
        border
        style="width: 100%"
      >
        <el-table-column type="index" width="50" />
        <el-table-column prop="orderNo" label="出库单号" width="180" />
        <el-table-column prop="type" label="出库类型" width="120">
          <template #default="{ row }">
            {{ getTypeText(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="orderDate" label="出库日期" width="120">
          <template #default="{ row }">
            {{ formatDateOnly(row.orderDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作员" width="110">
          <template #default="{ row }">
            <UserDisplay :value="row.operator" />
          </template>
        </el-table-column>
        <el-table-column prop="totalQuantity" label="总数量" width="100" />
        <el-table-column prop="totalAmount" label="总金额" width="120">
          <template #default="{ row }">
            ¥{{ Number(row.totalAmount || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDetail(row)">
              关联商品
            </el-button>
            <el-button type="primary" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              删除
            </el-button>
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

    <!-- 弹窗放在匿名插槽中，不会被嵌套在卡片内 -->
    <!-- 新建/编辑出库对话框 -->
    <BaseDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :form-data="form"
      :rules="rules"
      :loading="submitting"
      width="1000px"
      @confirm="handleSubmit"
      @cancel="handleCancel"
    >
      <template #form="{ form: formData }">
        <el-form-item label="出库类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择出库类型">
            <el-option 
              v-for="item in outboundTypes" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="出库日期" prop="orderDate">
          <el-date-picker
            v-model="formData.orderDate"
            type="date"
            placeholder="请选择出库日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="操作员" prop="operator">
          <UserSelect v-model="formData.operator" />
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            placeholder="请输入备注信息"
            :rows="3"
          />
        </el-form-item>
        
        <el-form-item label="出库商品" v-if="!isEdit">
          <div class="product-section">
            <div class="product-header">
              <el-button type="primary" @click="handleAddProduct">
                <el-icon><Plus /></el-icon>选择商品
              </el-button>
              <span class="product-count" v-if="formData.items.length > 0">
                已选择 {{ formData.items.length }} 个商品
              </span>
            </div>
            <el-table :data="formData.items" border style="width: 100%; margin-top: 10px;" v-if="formData.items.length > 0">
              <el-table-column type="index" label="序号" width="54" />
              <el-table-column label="商品信息" min-width="180">
                <template #default="{ row }">
                  <div class="product-info">
                    <div class="product-name">{{ row.productName }}</div>
                    <div class="product-code">编码：{{ row.productCode }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="specification" label="规格" width="100" />
              <el-table-column prop="unit" label="单位" width="60" />
              <el-table-column prop="currentStock" label="当前库存" width="100" />
              <el-table-column label="数量" width="120">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.quantity"
                    :min="1"
                    :max="row.currentStock || 999999"
                    :precision="0"
                    @change="calculateTotal"
                    size="small"
                  />
                </template>
              </el-table-column>
              <el-table-column label="单价" width="120">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.unitPrice"
                    :min="0"
                    :precision="2"
                    :step="0.01"
                    @change="calculateTotal"
                    size="small"
                  />
                </template>
              </el-table-column>
              <el-table-column label="金额" width="80">
                <template #default="{ row }">
                  <span class="amount">¥{{ ((row.quantity || 0) * (row.unitPrice || 0)).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60">
                <template #default="{ $index }">
                  <el-button
                    type="danger"
                    link
                    @click="handleRemoveProduct($index)"
                    size="small"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="empty-state" v-else>
              <el-empty description="暂无商品，请点击上方按钮选择商品" :image-size="80" />
            </div>
            <div class="total-amount" v-if="formData.items.length > 0">
              <div class="total-info">
                <span>商品总数：{{ formData.items.reduce((sum, item) => sum + (item.quantity || 0), 0) }}</span>
                <span class="total-price">总金额：¥{{ totalAmount.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </el-form-item>
      </template>
    </BaseDialog>

    <!-- 关联商品弹窗 -->
    <OrderItemsDialog
      v-model="orderItemsVisible"
      order-type="outbound"
      :order-id="selectedOrderId"
      :get-items-api="getOutboundItems"
      :type-map="outboundTypeMap"
    />

    <!-- 商品选择弹窗 -->
    <ProductSelectDialog
      v-model="productSelectVisible"
      :selected-product-ids="selectedProductIds"
      @confirm="handleProductSelectConfirm"
    />
  </ListPageLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { getOutboundList, createOutbound, updateOutbound, deleteOutbound, getOutboundItems } from '@/api/outbound'
import ListPageLayout from '@/components/ListPageLayout.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import UserSelect from '@/components/UserSelect.vue'
import OrderItemsDialog from '@/components/OrderItemsDialog.vue'
import ProductSelectDialog from '@/components/ProductSelectDialog.vue'
import { useUserStore } from '@/stores/user'
import { formatDateTime, getToday, formatDateOnly } from '@/utils/date'
import UserDisplay from '@/components/UserDisplay.vue'
import { useUsers } from '@/composables/useUsers'

const userStore = useUserStore()

// 使用用户数据composable
const { getAllUsers } = useUsers()

// 出库类型常量定义（与后端保持一致）
const OUTBOUND_TYPES = {
  STOCK_OUT: 'STOCK_OUT',         // 盘亏出库
  SALE: 'SALE'                   // 销售出库
}

// 出库类型选项（与后端保持一致）
const outboundTypes = [
  { label: '盘亏出库', value: OUTBOUND_TYPES.STOCK_OUT },
  { label: '销售出库', value: OUTBOUND_TYPES.SALE }
]

// 出库类型映射（与后端保持一致）
const outboundTypeMap = {
  [OUTBOUND_TYPES.STOCK_OUT]: '盘亏出库',
  [OUTBOUND_TYPES.SALE]: '销售出库'
}

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 20,
  orderNo: '',
  type: '',
  startDate: '',
  endDate: ''
})

// 数据列表
const loading = ref(false)
const outboundList = ref([])
const total = ref(0)
const dateRange = ref([]) // 日期范围选择器

// 表单相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const submitting = ref(false)
const form = ref({
  type: '',
  orderDate: '',
  operator: null,
  remark: '',
  items: []
})

const rules = {
  type: [
    { required: true, message: '请选择出库类型', trigger: 'change' }
  ],
  orderDate: [
    { required: true, message: '请选择出库日期', trigger: 'change' }
  ],
  operator: [
    { required: true, message: '请选择操作员', trigger: 'change' }
  ]
}

// 关联商品弹窗
const orderItemsVisible = ref(false)
const selectedOrderId = ref(null)

// 商品选择弹窗
const productSelectVisible = ref(false)

// 计算属性
const dialogTitle = computed(() => {
  return isEdit.value ? '编辑出库单' : '新建出库单'
})

const totalAmount = computed(() => {
  return form.value.items.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0)
  }, 0)
})

// 获取已选择的商品ID列表
const selectedProductIds = computed(() => {
  return form.value.items.map(item => item.productId).filter(id => id)
})

// 获取出库列表
const getList = async() => {
  loading.value = true
  try {
    const res = await getOutboundList(queryParams)
    outboundList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取出库列表失败:', error)
    ElMessage.error('获取出库列表失败')
  }
  loading.value = false
}

// 获取出库类型文本
const getTypeText = (type) => {
  return outboundTypeMap[type] || type
}

// 查询按钮
const handleQuery = () => {
  queryParams.page = 1
  getList()
}

// 重置按钮
const resetQuery = () => {
  queryParams.orderNo = ''
  queryParams.type = ''
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

// 新建出库
const handleCreate = () => {
  console.log('点击新建出库按钮')
  isEdit.value = false
  editId.value = null
  
  // 获取当前登录用户ID作为默认操作员
  const currentUserId = userStore.userInfo?.id || null
  console.log('当前登录用户ID:', currentUserId, '用户信息:', userStore.userInfo)
  
  // 获取今天的日期作为默认出库日期
  const today = getToday()
  
  // 重置表单数据
  form.value = {
    type: '',
    orderDate: today, // 设置默认出库日期为今天
    operator: currentUserId, // 设置当前用户为默认操作员
    remark: '',
    items: []
  }
  
  // 显示弹窗
  dialogVisible.value = true
  console.log('弹窗状态:', dialogVisible.value)
}

// 编辑出库
const handleEdit = async(row) => {
  try {
    isEdit.value = true
    editId.value = row.id
    
    // 确保operator字段为数字类型
    const operatorId = row.operator ? parseInt(row.operator) : null
    
    form.value = {
      type: row.type,
      orderDate: row.orderDate,
      operator: operatorId, // 确保为数字类型
      remark: row.remark,
      items: [] // 编辑时不显示商品列表
    }
    dialogVisible.value = true
  } catch (error) {
    console.error('编辑出库单失败:', error)
    ElMessage.error('编辑出库单失败')
  }
}

// 删除出库
const handleDelete = (row) => {
  ElMessageBox.confirm('确认要删除该出库单吗？删除后将恢复相关库存！', '警告', {
    type: 'warning'
  }).then(async() => {
    try {
      await deleteOutbound(row.id)
      ElMessage.success('删除成功')
      getList()
    } catch (error) {
      console.error('删除出库单失败:', error)
      ElMessage.error('删除出库单失败')
    }
  })
}

// 查看详情
const handleDetail = async(row) => {
  selectedOrderId.value = row.id
  orderItemsVisible.value = true
}

// 添加商品
const handleAddProduct = () => {
  productSelectVisible.value = true
}

// 移除商品
const handleRemoveProduct = (index) => {
  form.value.items.splice(index, 1)
  calculateTotal()
}

// 商品选择确认
const handleProductSelectConfirm = (selectedProducts) => {
  console.log('选中的商品:', selectedProducts)
  
  // 将选中的商品添加到出库商品列表中
  selectedProducts.forEach(product => {
    // 检查是否已经存在该商品
    const existingIndex = form.value.items.findIndex(item => item.productId === product.id)
    
    if (existingIndex === -1) {
      // 不存在则添加新商品
      form.value.items.push({
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        specification: product.specification || '',
        unit: product.unit || '',
        currentStock: product.currentStock || 0, // 当前库存
        quantity: 1,
        unitPrice: product.retailPrice || 0 // 出库使用零售价
      })
    } else {
      // 已存在则更新数量（可选择是否累加）
      ElMessage.warning(`商品 ${product.name} 已存在，请直接修改数量`)
    }
  })
  
  console.log('更新后的商品列表:', form.value.items)
  
  // 重新计算总金额
  calculateTotal()
}

// 计算总金额
const calculateTotal = () => {
  // 触发响应式更新，totalAmount 计算属性会自动重新计算
}

// 提交表单
const handleSubmit = async(formData) => {
  submitting.value = true
  try {
    if (isEdit.value) {
      // 编辑模式：只提交基本信息（注意：出库单编辑的是operator和remark）
      await updateOutbound(editId.value, {
        type: formData.type,
        orderDate: formData.orderDate,
        operator: formData.operator,
        remark: formData.remark
      })
      ElMessage.success('更新成功')
    } else {
      // 新建模式：提交完整信息
      await createOutbound({
        type: formData.type,
        orderDate: formData.orderDate,
        operator: formData.operator,
        remark: formData.remark,
        items: formData.items
      })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    getList()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

// 取消弹窗
const handleCancel = () => {
  dialogVisible.value = false
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
  // 预加载用户数据，确保UserDisplay和UserSelect组件能正常显示
  getAllUsers()
})
</script>

<style scoped>
.product-section {
  width: 100%;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.product-count {
  color: #409eff;
  font-size: 14px;
}

.product-info {
  .product-name {
    font-weight: 500;
    color: #303133;
    margin-bottom: 4px;
  }
  
  .product-code {
    font-size: 12px;
    color: #909399;
  }
}

.amount {
  font-weight: 500;
  color: #409eff;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.total-amount {
  margin-top: 15px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border-left: 4px solid #409eff;
  
  .total-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    span {
      font-size: 14px;
      color: #606266;
    }
    
    .total-price {
      font-size: 16px;
      font-weight: bold;
      color: #409eff;
    }
  }
}
</style> 
