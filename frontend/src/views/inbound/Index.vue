<template>
  <div class="inbound-container">
    <div class="header">
      <h2>入库管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>新建入库
      </el-button>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="入库单号">
          <el-input v-model="queryParams.code" placeholder="请输入入库单号" clearable />
        </el-form-item>
        <el-form-item label="入库类型">
          <el-select v-model="queryParams.type" placeholder="请选择类型" clearable>
            <el-option label="采购入库" value="purchase" />
            <el-option label="退货入库" value="return" />
            <el-option label="调拨入库" value="transfer" />
          </el-select>
        </el-form-item>
        <el-form-item label="入库状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="待入库" value="pending" />
            <el-option label="已入库" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="入库日期">
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
        :data="inboundList"
        border
        style="width: 100%"
      >
        <el-table-column type="index" width="50" />
        <el-table-column prop="code" label="入库单号" />
        <el-table-column prop="type" label="入库类型">
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
              入库
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

    <!-- 新建入库对话框 -->
    <el-dialog
      title="新建入库"
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
        <el-form-item label="入库类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择入库类型">
            <el-option label="采购入库" value="purchase" />
            <el-option label="退货入库" value="return" />
            <el-option label="调拨入库" value="transfer" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商" prop="supplierId" v-if="form.type === 'purchase'">
          <el-select v-model="form.supplierId" placeholder="请选择供应商">
            <el-option
              v-for="item in suppliers"
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
        <el-form-item label="入库商品">
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
            <el-table-column label="数量" width="150">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.quantity"
                  :min="1"
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
import { getInboundList, createInbound, completeInbound, cancelInbound } from '@/api/inbound'
import { getSuppliers } from '@/api/product'

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
const inboundList = ref([])
const total = ref(0)

// 表单相关
const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({
  type: '',
  supplierId: undefined,
  remark: '',
  products: []
})

const rules = {
  type: [
    { required: true, message: '请选择入库类型', trigger: 'change' }
  ],
  supplierId: [
    { required: true, message: '请选择供应商', trigger: 'change' }
  ]
}

// 供应商和商品列表
const suppliers = ref([])
const products = ref([])

// 计算总金额
const totalAmount = computed(() => {
  return form.products.reduce((sum, item) => {
    return sum + item.quantity * item.price
  }, 0)
})

// 获取入库列表
const getList = async () => {
  loading.value = true
  try {
    const res = await getInboundList(queryParams)
    inboundList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取入库列表失败:', error)
    ElMessage.error('获取入库列表失败')
  }
  loading.value = false
}

// 获取供应商列表
const getSupplierList = async () => {
  try {
    const res = await getSuppliers()
    suppliers.value = res.data
  } catch (error) {
    console.error('获取供应商列表失败:', error)
    ElMessage.error('获取供应商列表失败')
  }
}

// 获取商品列表
const getProductList = async () => {
  try {
    // TODO: 调用后端API获取商品列表
    products.value = [
      {
        id: 1,
        name: '商品A',
        specification: '500ml/瓶',
        unit: '瓶'
      },
      {
        id: 2,
        name: '商品B',
        specification: '1kg/袋',
        unit: '袋'
      }
    ]
  } catch (error) {
    console.error('获取商品列表失败:', error)
  }
}

// 获取入库类型文本
const getTypeText = (type) => {
  const map = {
    purchase: '采购入库',
    return: '退货入库',
    transfer: '调拨入库'
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
    pending: '待入库',
    completed: '已入库',
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

// 新建入库
const handleCreate = () => {
  form.type = ''
  form.supplierId = undefined
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

// 完成入库
const handleComplete = (row) => {
  ElMessageBox.confirm('确认要完成该入库单吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await completeInbound(row.id)
      ElMessage.success('入库已完成')
      getList()
    } catch (error) {
      console.error('完成入库失败:', error)
      ElMessage.error('完成入库失败')
    }
  })
}

// 取消入库
const handleCancel = (row) => {
  ElMessageBox.confirm('确认要取消该入库单吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await cancelInbound(row.id)
      ElMessage.success('入库已取消')
      getList()
    } catch (error) {
      console.error('取消入库失败:', error)
      ElMessage.error('取消入库失败')
    }
  })
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await createInbound(form)
        ElMessage.success('创建成功')
        dialogVisible.value = false
        getList()
      } catch (error) {
        console.error('创建入库单失败:', error)
        ElMessage.error('创建入库单失败')
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
  getSupplierList()
  getProductList()
})
</script>

<style scoped>
.inbound-container {
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