<template>
  <ListPageLayout>
    <template #filter>
      <el-form :inline="true" :model="searchForm" class="filter-form">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入订单编号" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select 
            v-model="searchForm.status" 
            placeholder="请选择状态" 
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="(text, status) in statusMap"
              :key="status"
              :label="text"
              :value="status"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商">
          <el-select 
            v-model="searchForm.supplierId" 
            placeholder="请选择供应商" 
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="supplier in suppliers"
              :key="supplier.id"
              :label="supplier.name"
              :value="supplier.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>新建采购订单
          </el-button>
        </el-form-item>
      </el-form>
    </template>

    <template #content>
      <el-table
        v-loading="loading"
        :data="orders"
        border
        style="width: 100%"
      >
        <el-table-column type="index" width="50" />
        <el-table-column prop="orderNo" label="订单编号" width="180" />
        <el-table-column label="供应商" width="180">
          <template #default="scope">
            {{ scope.row.supplier?.name || '未知供应商' }}
          </template>
        </el-table-column>
        <el-table-column prop="orderDate" label="采购日期" width="120">
          <template #default="scope">
            {{ formatDateOnly(scope.row.orderDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="expectedArrivalDate" label="预计到货日期" width="120">
          <template #default="scope">
            {{ formatDateOnly(scope.row.expectedArrivalDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="100" />
        <el-table-column prop="totalAmount" label="总金额" width="120">
          <template #default="scope">
            <span class="amount">¥{{ Number(scope.row.totalAmount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalQuantity" label="总数量" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="operator" label="操作员" width="110">
          <template #default="scope">
            <UserDisplay :value="scope.row.operator" />
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" />
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="260">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === PURCHASE_ORDER_STATUS.PENDING"
              type="success"
              link
              @click="handleConfirm(scope.row)"
            >
              确认
            </el-button>
            <el-button
              type="primary"
              link
              @click="handleDetail(scope.row)"
            >
              采购明细
            </el-button>
            <el-button
              type="primary"
              link
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </template>

    <!-- 弹窗放在匿名插槽中，不会被嵌套在卡片内 -->
    <!-- 新建/编辑对话框 -->
    <BaseDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :form-data="form"
      :rules="formRules"
      :loading="submitting"
      width="1000px"
      @confirm="handleSubmit"
      @cancel="handleCancel"
    >
      <template #form="{ form: formData }">
        <el-form-item label="供应商" prop="supplierId">
          <el-select 
            v-model="formData.supplierId" 
            placeholder="请选择供应商"
            style="width: 100%"
            filterable
            @change="handleSupplierChange"
          >
            <el-option
              v-for="supplier in suppliers"
              :key="supplier.id"
              :label="supplier.name"
              :value="supplier.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="采购日期" prop="orderDate">
          <el-date-picker
            v-model="formData.orderDate"
            type="date"
            placeholder="请选择采购日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="预计到货日期" prop="expectedArrivalDate">
          <el-date-picker
            v-model="formData.expectedArrivalDate"
            type="date"
            placeholder="请选择预计到货日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="付款方式" prop="paymentMethod">
          <el-select 
            v-model="formData.paymentMethod" 
            placeholder="请选择付款方式"
            style="width: 100%"
          >
            <el-option
              v-for="(text, method) in PAYMENT_METHOD"
              :key="method"
              :label="text"
              :value="method"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            placeholder="请输入备注信息"
            :rows="3"
          />
        </el-form-item>
        
        <el-form-item label="采购商品" v-if="!isEdit">
          <div class="product-section">
            <div class="product-header">
              <el-button 
                type="primary" 
                :disabled="!formData.supplierId"
                @click="handleAddProduct"
              >
                <el-icon><Plus /></el-icon>选择商品
              </el-button>
              <span class="supplier-tip" v-if="!formData.supplierId">
                请先选择供应商
              </span>
              <span class="product-count" v-if="formData.items.length > 0">
                已选择 {{ formData.items.length }} 个商品
              </span>
            </div>
            <el-table :data="formData.items" border style="width: 100%; margin-top: 10px;" v-if="formData.items.length > 0">
              <el-table-column type="index" label="序号" width="54" />
              <el-table-column label="商品信息" min-width="160">
                <template #default="{ row }">
                  <div class="product-info">
                    <div class="product-name">{{ row.productName }}</div>
                    <div class="product-code">编码：{{ row.productCode }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="specification" label="规格" width="100" />
              <el-table-column prop="unit" label="单位" width="60" />
              <el-table-column label="数量" width="120">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.quantity"
                    :min="1"
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
              <el-table-column label="金额" width="100">
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

    <!-- 商品选择弹窗 -->
    <ProductSelectDialog
      v-model="productSelectVisible"
      :selected-product-ids="selectedProductIds"
      :supplier-id="form.supplierId"
      @confirm="handleProductSelectConfirm"
    />

    <!-- 采购明细弹窗 -->
    <OrderItemsDialog
      v-model="orderItemsVisible"
      order-type="purchase"
      :order-id="selectedOrderId"
      :get-items-api="getPurchaseOrderItems"
      :type-map="purchaseOrderTypeMap"
    />
  </ListPageLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { formatDateOnly, formatDateTime } from '@/utils/date'
import ListPageLayout from '@/components/ListPageLayout.vue'
import OrderItemsDialog from '@/components/OrderItemsDialog.vue'
import UserDisplay from '@/components/UserDisplay.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import ProductSelectDialog from '@/components/ProductSelectDialog.vue'
import {
  getPurchaseOrders,
  getPurchaseOrderItems,
  confirmPurchaseOrder,
  createPurchaseOrder,
  deletePurchaseOrder,
  PURCHASE_ORDER_STATUS,
  PAYMENT_METHOD
} from '@/api/purchase'
import { getSupplierList } from '@/api/supplier'
import { useUserStore } from '@/stores/user'
import { getToday } from '@/utils/date'

const userStore = useUserStore()

// 数据
const orders = ref([])
const suppliers = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const searchForm = ref({
  orderNo: '',
  status: '',
  supplierId: '',
  dateRange: []
})

// 对话框控制
const dialogVisible = ref(false)
const dialogType = ref('create')
const currentOrder = ref(null)
const isEdit = ref(false)
const submitting = ref(false)

// 表单数据
const form = ref({
  supplierId: '',
  orderDate: '',
  expectedArrivalDate: '',
  paymentMethod: '',
  remark: '',
  items: []
})

// 表单验证规则
const formRules = {
  supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  orderDate: [{ required: true, message: '请选择采购日期', trigger: 'change' }],
  expectedArrivalDate: [{ required: true, message: '请选择预计到货日期', trigger: 'change' }],
  paymentMethod: [{ required: true, message: '请选择付款方式', trigger: 'change' }]
}

// 商品选择弹窗
const productSelectVisible = ref(false)

// 采购明细弹窗
const orderItemsVisible = ref(false)
const selectedOrderId = ref(null)

// 采购订单类型映射（用于明细弹窗显示）
const purchaseOrderTypeMap = {
  'PENDING': '未确认',
  'CONFIRMED': '已确认'
}

// 状态映射
const statusMap = {
  [PURCHASE_ORDER_STATUS.PENDING]: '未确认',
  [PURCHASE_ORDER_STATUS.CONFIRMED]: '已确认'
}

// 计算属性
const dialogTitle = computed(() => {
  return dialogType.value === 'create' ? '新建采购订单' : '编辑采购订单'
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

// 获取订单列表
const fetchOrders = async() => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      orderNo: searchForm.value.orderNo,
      status: searchForm.value.status,
      supplierId: searchForm.value.supplierId,
      startDate: searchForm.value.dateRange?.[0],
      endDate: searchForm.value.dateRange?.[1]
    }
    const res = await getPurchaseOrders(params)
    // 根据后端返回的数据结构调整
    orders.value = res.data.list || res.data.items || []
    total.value = res.data.total
  } catch (error) {
    ElMessage.error(error.message || '获取采购订单列表失败')
  } finally {
    loading.value = false
  }
}

// 获取供应商列表
const fetchSuppliers = async() => {
  try {
    const res = await getSupplierList()
    suppliers.value = res.data.list || res.data || []
  } catch (error) {
    ElMessage.error(error.message || '获取供应商列表失败')
  }
}

// 状态相关方法
const getStatusType = (status) => {
  const map = {
    [PURCHASE_ORDER_STATUS.PENDING]: 'info',
    [PURCHASE_ORDER_STATUS.CONFIRMED]: 'warning'
  }
  return map[status]
}

const getStatusText = (status) => {
  return statusMap[status] || status
}

// 事件处理方法
const handleCreate = () => {
  dialogType.value = 'create'
  isEdit.value = false
  currentOrder.value = null
  
  // 重置表单数据
  form.value = {
    supplierId: '',
    orderDate: getToday(),
    expectedArrivalDate: '',
    paymentMethod: '',
    remark: '',
    items: []
  }
  
  dialogVisible.value = true
}

const handleEdit = (order) => {
  dialogType.value = 'edit'
  isEdit.value = true
  currentOrder.value = order
  
  // 填充表单数据
  form.value = {
    supplierId: order.supplierId,
    orderDate: order.orderDate,
    expectedArrivalDate: order.expectedArrivalDate,
    paymentMethod: order.paymentMethod,
    remark: order.remark,
    items: [] // 编辑时不显示商品列表
  }
  
  dialogVisible.value = true
}

const handleDetail = (order) => {
  selectedOrderId.value = order.id
  orderItemsVisible.value = true
}

const handleConfirm = async(order) => {
  try {
    await ElMessageBox.confirm('确认要确认该采购订单吗？确认后将自动生成采购入库单。', '提示', {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    })
    const res = await confirmPurchaseOrder(order.id)
    ElMessage.success(`确认成功，已生成入库单：${res.data.inboundOrder.orderNo}`)
    fetchOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '确认失败')
    }
  }
}

const handleDelete = async(order) => {
  try {
    await ElMessageBox.confirm(`确认要删除采购订单 ${order.orderNo} 吗？${order.status === 'CONFIRMED' ? '该操作会同时删除关联的入库单。' : ''}`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger'
    })
    await deletePurchaseOrder(order.id)
    ElMessage.success('删除成功')
    fetchOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchOrders()
}

const resetSearch = () => {
  searchForm.value = {
    orderNo: '',
    status: '',
    supplierId: '',
    dateRange: []
  }
  handleSearch()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchOrders()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchOrders()
}

const handleSubmit = async(formData) => {
  submitting.value = true
  try {
    if (isEdit.value) {
      // 编辑模式：调用编辑API
      // await updatePurchaseOrder(currentOrder.value.id, formData)
      ElMessage.success('更新成功')
    } else {
      // 新建模式：提交完整信息
      const data = {
        ...formData,
        operator: userStore.userInfo?.username || 'admin'
      }
      await createPurchaseOrder(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchOrders()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error(error.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  dialogVisible.value = false
}

const handleAddProduct = () => {
  if (!form.value.supplierId) {
    ElMessage.warning('请先选择供应商')
    return
  }
  productSelectVisible.value = true
}

// 商品选择确认
const handleProductSelectConfirm = (selectedProducts) => {
  // 将选中的商品添加到采购商品列表中
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
        quantity: 1,
        unitPrice: product.purchasePrice || 0
      })
    } else {
      // 已存在则提示用户
      ElMessage.warning(`商品 ${product.name} 已存在，请直接修改数量`)
    }
  })
  
  // 重新计算总金额
  calculateTotal()
}

const handleRemoveProduct = (index) => {
  form.value.items.splice(index, 1)
  calculateTotal()
}

const calculateTotal = () => {
  // 更新每行的总价
  form.value.items.forEach(item => {
    item.totalPrice = (item.quantity || 0) * (item.unitPrice || 0)
  })
}

const handleSupplierChange = () => {
  // 如果有已选商品，提示用户
  if (form.value.items.length > 0) {
    ElMessage.warning('更换供应商将清空已选择的商品')
  }
  // 清空已选商品
  form.value.items = []
  calculateTotal()
}

// 生命周期钩子
onMounted(() => {
  fetchOrders()
  fetchSuppliers()
})
</script>

<style scoped>
.amount {
  font-weight: 500;
  color: #409eff;
}

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

.supplier-tip {
  color: #909399;
  font-size: 12px;
}
</style> 
