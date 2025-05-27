<template>
  <ListPageLayout>
    <template #filter>
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="盘点单号">
          <el-input v-model="queryParams.orderNo" placeholder="请输入盘点单号" />
        </el-form-item>
        <el-form-item label="操作员">
          <el-select 
            v-model="queryParams.operator" 
            placeholder="请选择操作员" 
            clearable
            filterable
            style="width: 150px"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.fullname"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="盘点日期">
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
            <el-icon><Plus /></el-icon>新建盘点
          </el-button>
        </el-form-item>
      </el-form>
    </template>

    <template #content>
      <el-table
        v-loading="loading"
        :data="stocktakingList"
        border
        style="width: 100%"
      >
        <el-table-column type="index" width="50" />
        <el-table-column prop="orderNo" label="盘点单号" width="180" />
        <el-table-column prop="stocktakingDate" label="盘点日期" width="180">
          <template #default="{ row }">
            {{ formatDateOnly(row.stocktakingDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作员" width="100">
          <template #default="{ row }">
            <UserDisplay :value="row.operator" />
          </template>
        </el-table-column>
        <el-table-column prop="totalItems" label="盘点商品数" width="120" />
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDetail(row)">
              盘点明细
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

    <!-- 新建盘点对话框 -->
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
        <el-form-item label="盘点日期" prop="stocktakingDate">
          <el-date-picker
            v-model="formData.stocktakingDate"
            type="date"
            placeholder="请选择盘点日期"
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
        
        <el-form-item label="盘点商品">
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
              <el-table-column label="系统库存" width="100">
                <template #default="{ row }">
                  <span class="system-stock">{{ row.systemQuantity || 0 }}</span>
                </template>
              </el-table-column>
              <el-table-column label="实际数量" width="120">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.actualQuantity"
                    :min="0"
                    :precision="0"
                    size="small"
                  />
                </template>
              </el-table-column>
              <el-table-column label="差异" width="80">
                <template #default="{ row }">
                  <span 
                    :class="getDifferenceClass((row.actualQuantity || 0) - (row.systemQuantity || 0))"
                  >
                    {{ (row.actualQuantity || 0) - (row.systemQuantity || 0) }}
                  </span>
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
            <div class="summary-info" v-if="formData.items.length > 0">
              <div class="summary-item">
                <span>盘点商品总数：{{ formData.items.length }}</span>
              </div>
              <div class="summary-item">
                <span>盘盈商品：{{ profitCount }}</span>
                <span class="profit">盘亏商品：{{ lossCount }}</span>
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
      @confirm="handleProductSelectConfirm"
    />

    <!-- 盘点明细弹窗 -->
    <StocktakingItemsDialog
      v-model="itemsDialogVisible"
      :stocktaking-order-id="selectedOrderId"
    />
  </ListPageLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { 
  getStocktakingList, 
  createStocktaking, 
  deleteStocktaking 
} from '@/api/stocktaking'
import { getUserList } from '@/api/user'
import ListPageLayout from '@/components/ListPageLayout.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import UserSelect from '@/components/UserSelect.vue'
import ProductSelectDialog from '@/components/ProductSelectDialog.vue'
import StocktakingItemsDialog from '@/components/StocktakingItemsDialog.vue'
import { useUserStore } from '@/stores/user'
import { formatDateTime, getToday, formatDateOnly } from '@/utils/date'
import UserDisplay from '@/components/UserDisplay.vue'

const userStore = useUserStore()

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 20,
  orderNo: '',
  operator: '',
  startDate: '',
  endDate: ''
})

// 数据列表
const loading = ref(false)
const stocktakingList = ref([])
const total = ref(0)
const dateRange = ref([]) // 日期范围选择器
const userList = ref([]) // 用户列表

// 表单相关
const dialogVisible = ref(false)
const submitting = ref(false)
const form = ref({
  stocktakingDate: '',
  operator: null,
  remark: '',
  items: []
})

const rules = {
  stocktakingDate: [
    { required: true, message: '请选择盘点日期', trigger: 'change' }
  ],
  operator: [
    { required: true, message: '请选择操作员', trigger: 'change' }
  ]
}

// 商品选择弹窗
const productSelectVisible = ref(false)

// 盘点明细弹窗
const itemsDialogVisible = ref(false)
const selectedOrderId = ref(null)

// 计算属性
const dialogTitle = computed(() => '新建盘点单')

// 获取已选择的商品ID列表
const selectedProductIds = computed(() => {
  return form.value.items.map(item => item.productId).filter(id => id)
})

// 盘盈商品数量
const profitCount = computed(() => {
  return form.value.items.filter(item => 
    (item.actualQuantity || 0) > (item.systemQuantity || 0)
  ).length
})

// 盘亏商品数量
const lossCount = computed(() => {
  return form.value.items.filter(item => 
    (item.actualQuantity || 0) < (item.systemQuantity || 0)
  ).length
})

// 获取盘点列表
const getList = async () => {
  loading.value = true
  try {
    const res = await getStocktakingList(queryParams)
    stocktakingList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取盘点列表失败:', error)
    ElMessage.error('获取盘点列表失败')
  }
  loading.value = false
}

// 获取用户列表
const getUsersList = async () => {
  try {
    const response = await getUserList({ pageSize: 1000 }) // 获取所有用户
    userList.value = response.data || []
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

// 查询按钮
const handleQuery = () => {
  queryParams.page = 1
  getList()
}

// 重置按钮
const resetQuery = () => {
  queryParams.orderNo = ''
  queryParams.operator = ''
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

// 新建盘点
const handleCreate = () => {
  form.value = {
    stocktakingDate: getToday(),
    operator: userStore.userInfo?.id || null,
    remark: '',
    items: []
  }
  dialogVisible.value = true
}

// 查看盘点明细
const handleDetail = (row) => {
  selectedOrderId.value = row.id
  itemsDialogVisible.value = true
}

// 删除盘点单
const handleDelete = (row) => {
  ElMessageBox.confirm('确认要删除该盘点单吗？删除后不可恢复！', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteStocktaking(row.id)
      ElMessage.success('删除成功')
      getList()
    } catch (error) {
      console.error('删除盘点单失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

// 添加商品
const handleAddProduct = () => {
  productSelectVisible.value = true
}

// 商品选择确认
const handleProductSelectConfirm = async (selectedProducts) => {
  try {
    // 获取选中商品的库存信息
    const productIds = selectedProducts.map(p => p.id)
    
    // 过滤掉已经存在的商品
    const existingProductIds = form.value.items.map(item => item.productId)
    const newProducts = selectedProducts.filter(p => !existingProductIds.includes(p.id))
    
    if (newProducts.length === 0) {
      ElMessage.warning('所选商品已存在于盘点列表中')
      return
    }
    
    // 添加新商品到盘点列表
    const newItems = newProducts.map(product => ({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      specification: product.specification || '',
      unit: product.unit,
      systemQuantity: product.currentStock || 0,
      actualQuantity: product.currentStock || 0 // 默认实际数量等于系统库存
    }))
    
    form.value.items.push(...newItems)
    ElMessage.success(`成功添加 ${newProducts.length} 个商品`)
  } catch (error) {
    console.error('添加商品失败:', error)
    ElMessage.error('添加商品失败')
  }
}

// 移除商品
const handleRemoveProduct = (index) => {
  form.value.items.splice(index, 1)
}

// 获取差异样式类
const getDifferenceClass = (difference) => {
  if (difference > 0) return 'profit'
  if (difference < 0) return 'loss'
  return 'normal'
}

// 提交表单
const handleSubmit = async () => {
  if (form.value.items.length === 0) {
    ElMessage.warning('请至少选择一个商品进行盘点')
    return
  }
  
  submitting.value = true
  try {
    const submitData = {
      stocktakingDate: form.value.stocktakingDate,
      operator: form.value.operator,
      remark: form.value.remark,
      items: form.value.items.map(item => ({
        productId: item.productId,
        actualQuantity: item.actualQuantity || 0
      }))
    }
    
    const res = await createStocktaking(submitData)
    
    // 显示创建结果信息
    let message = res.message || '盘点单创建成功'
    if (res.data.autoCreatedOrders && res.data.autoCreatedOrders.length > 0) {
      const orderInfo = res.data.autoCreatedOrders.map(order => 
        `${order.type}(${order.orderNo})`
      ).join('、')
      message += `，已自动创建：${orderInfo}`
    }
    
    ElMessage.success(message)
    dialogVisible.value = false
    getList()
  } catch (error) {
    console.error('创建盘点单失败:', error)
    ElMessage.error(error.message || '创建失败')
  }
  submitting.value = false
}

// 取消对话框
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
  getUsersList()
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

.summary-info {
  margin-top: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-item {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #606266;
}

.empty-state {
  margin: 20px 0;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 