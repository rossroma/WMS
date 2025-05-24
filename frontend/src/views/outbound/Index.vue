<template>
  <div class="outbound-container">
    <div class="header">
      <h2>出库管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>新建出库
      </el-button>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="出库单号">
          <el-input v-model="queryParams.code" placeholder="请输入出库单号" clearable />
        </el-form-item>
        <el-form-item label="出库类型">
          <el-select v-model="queryParams.type" placeholder="请选择类型" clearable>
            <el-option label="销售出库" value="sale" />
            <el-option label="退货出库" value="return" />
            <el-option label="调拨出库" value="transfer" />
          </el-select>
        </el-form-item>
        <el-form-item label="出库状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="待出库" value="pending" />
            <el-option label="已出库" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="出库日期">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
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
        :data="outboundList"
        border
        style="width: 100%"
      >
        <el-table-column type="index" width="50" />
        <el-table-column prop="code" label="出库单号" />
        <el-table-column prop="type" label="出库类型">
          <template #default="{ row }">
            {{ getTypeText(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column prop="operator" label="操作人" />
        <el-table-column prop="totalProducts" label="商品数量" />
        <el-table-column prop="totalAmount" label="总金额">
          <template #default="{ row }">
            ¥{{ row.totalAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="primary"
              link
              @click="handleComplete(row)"
            >
              出库
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="danger"
              link
              @click="handleCancel(row)"
            >
              取消
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

    <!-- 新建出库对话框 -->
    <el-dialog
      title="新建出库"
      v-model="dialogVisible"
      width="800px"
      append-to-body
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="出库类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择出库类型">
            <el-option label="销售出库" value="sale" />
            <el-option label="退货出库" value="return" />
            <el-option label="调拨出库" value="transfer" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户" prop="customerId" v-if="form.type === 'sale'">
          <el-select v-model="form.customerId" placeholder="请选择客户">
            <el-option
              v-for="item in customers"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            placeholder="请输入备注信息"
          />
        </el-form-item>
        <el-form-item label="出库商品">
          <div class="product-header">
            <el-button type="primary" @click="handleAddProduct">
              <el-icon><Plus /></el-icon>添加商品
            </el-button>
          </div>
          <el-table :data="form.products" border style="width: 100%">
            <el-table-column type="index" width="50" />
            <el-table-column label="商品" min-width="200">
              <template #default="{ row }">
                <el-select
                  v-model="row.productId"
                  placeholder="请选择商品"
                  @change="handleProductChange($event, row)"
                >
                  <el-option
                    v-for="item in products"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="specification" label="规格" />
            <el-table-column prop="unit" label="单位" />
            <el-table-column prop="currentStock" label="当前库存" />
            <el-table-column label="数量" width="150">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.quantity"
                  :min="1"
                  :max="row.currentStock"
                  :precision="0"
                  @change="calculateTotal"
                />
              </template>
            </el-table-column>
            <el-table-column label="单价" width="150">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.price"
                  :min="0"
                  :precision="2"
                  :step="0.01"
                  @change="calculateTotal"
                />
              </template>
            </el-table-column>
            <el-table-column label="金额" width="150">
              <template #default="{ row }">
                ¥{{ (row.quantity * row.price).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button
                  type="danger"
                  link
                  @click="handleRemoveProduct($index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="total-amount">
            总金额：¥{{ totalAmount.toFixed(2) }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { getOutboundList, createOutbound, completeOutbound, cancelOutbound } from '@/api/outbound'
import { getProductList } from '@/api/product'

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  code: '',
  type: undefined,
  status: undefined,
  dateRange: []
})

// 数据列表
const loading = ref(false)
const outboundList = ref([])
const total = ref(0)

// 表单相关
const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({
  type: '',
  customerId: undefined,
  remark: '',
  products: []
})

const rules = {
  type: [
    { required: true, message: '请选择出库类型', trigger: 'change' }
  ],
  customerId: [
    { required: true, message: '请选择客户', trigger: 'change' }
  ]
}

// 商品列表
const products = ref([])
const customers = ref([])

// 计算总金额
const totalAmount = computed(() => {
  return form.products.reduce((sum, item) => {
    return sum + item.quantity * item.price
  }, 0)
})

// 获取出库列表
const getList = async () => {
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

// 获取商品列表
const getProductList = async () => {
  try {
    const res = await getProductList()
    products.value = res.data
  } catch (error) {
    console.error('获取商品列表失败:', error)
    ElMessage.error('获取商品列表失败')
  }
}

// 获取出库类型文本
const getTypeText = (type) => {
  const map = {
    sale: '销售出库',
    return: '退货出库',
    transfer: '调拨出库'
  }
  return map[type]
}

// 获取状态类型
const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'info'
  }
  return map[status]
}

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    pending: '待出库',
    completed: '已出库',
    cancelled: '已取消'
  }
  return map[status]
}

// 查询按钮
const handleQuery = () => {
  queryParams.page = 1
  getList()
}

// 重置按钮
const resetQuery = () => {
  queryParams.code = ''
  queryParams.type = undefined
  queryParams.status = undefined
  queryParams.dateRange = []
  handleQuery()
}

// 新建出库
const handleCreate = () => {
  form.type = ''
  form.customerId = undefined
  form.remark = ''
  form.products = []
  dialogVisible.value = true
}

// 添加商品
const handleAddProduct = () => {
  form.products.push({
    productId: undefined,
    specification: '',
    unit: '',
    currentStock: 0,
    quantity: 1,
    price: 0
  })
}

// 移除商品
const handleRemoveProduct = (index) => {
  form.products.splice(index, 1)
  calculateTotal()
}

// 商品选择变化
const handleProductChange = (productId, row) => {
  const product = products.value.find(item => item.id === productId)
  if (product) {
    row.specification = product.specification
    row.unit = product.unit
    row.currentStock = product.currentStock
  }
}

// 计算总金额
const calculateTotal = () => {
  // 已通过计算属性实现
}

// 查看详情
const handleDetail = (row) => {
  // TODO: 实现查看详情功能
  console.log('查看详情:', row)
}

// 完成出库
const handleComplete = (row) => {
  ElMessageBox.confirm('确认要完成该出库单吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await completeOutbound(row.id)
      ElMessage.success('出库已完成')
      getList()
    } catch (error) {
      console.error('完成出库失败:', error)
      ElMessage.error('完成出库失败')
    }
  })
}

// 取消出库
const handleCancel = (row) => {
  ElMessageBox.confirm('确认要取消该出库单吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await cancelOutbound(row.id)
      ElMessage.success('出库已取消')
      getList()
    } catch (error) {
      console.error('取消出库失败:', error)
      ElMessage.error('取消出库失败')
    }
  })
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await createOutbound(form)
        ElMessage.success('创建成功')
        dialogVisible.value = false
        getList()
      } catch (error) {
        console.error('创建出库单失败:', error)
        ElMessage.error('创建出库单失败')
      }
    }
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
  getProductList()
})
</script>

<style scoped>
.outbound-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.product-header {
  margin-bottom: 10px;
}

.total-amount {
  margin-top: 10px;
  text-align: right;
  font-size: 16px;
  font-weight: bold;
}

.dialog-footer {
  text-align: right;
}
</style> 