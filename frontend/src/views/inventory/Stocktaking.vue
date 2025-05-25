<template>
  <div class="stocktaking-container">
    <div class="header">
      <h2>商品盘点</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>新建盘点
      </el-button>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="盘点编号">
          <el-input v-model="queryParams.code" placeholder="请输入盘点编号" clearable />
        </el-form-item>
        <el-form-item label="盘点状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="进行中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="盘点日期">
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
        :data="stocktakingList"
        border
        style="width: 100%"
      >
        <el-table-column type="index" width="50" />
        <el-table-column prop="code" label="盘点编号" />
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" />
        <el-table-column prop="totalProducts" label="盘点商品数" />
        <el-table-column prop="accuracy" label="准确率">
          <template #default="{ row }">
            {{ row.accuracy }}%
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
              v-if="row.status === 'processing'"
              type="primary"
              link
              @click="handleComplete(row)"
            >
              完成
            </el-button>
            <el-button
              v-if="row.status === 'processing'"
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

    <!-- 新建盘点对话框 -->
    <el-dialog
      title="新建盘点"
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
        <el-form-item label="盘点说明" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入盘点说明"
          />
        </el-form-item>
        <el-form-item label="盘点商品">
          <el-table :data="form.products" border style="width: 100%">
            <el-table-column type="index" width="50" />
            <el-table-column prop="name" label="商品名称" />
            <el-table-column prop="specification" label="规格" />
            <el-table-column prop="unit" label="单位" />
            <el-table-column prop="systemStock" label="系统库存" />
            <el-table-column prop="actualStock" label="实际库存">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.actualStock"
                  :min="0"
                  :precision="0"
                />
              </template>
            </el-table-column>
            <el-table-column prop="difference" label="差异">
              <template #default="{ row }">
                {{ row.actualStock - row.systemStock }}
              </template>
            </el-table-column>
          </el-table>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/date'

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  code: '',
  status: undefined,
  dateRange: []
})

// 数据列表
const loading = ref(false)
const stocktakingList = ref([])
const total = ref(0)

// 表单相关
const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({
  description: '',
  products: []
})

const rules = {
  description: [
    { required: true, message: '请输入盘点说明', trigger: 'blur' }
  ]
}

// 获取盘点列表
const getList = async () => {
  loading.value = true
  try {
    // TODO: 调用后端API获取盘点列表
    // 模拟数据
    stocktakingList.value = [
      {
        id: 1,
        code: 'PD202403150001',
        createTime: '2024-03-15 10:00:00',
        operator: '张三',
        totalProducts: 100,
        accuracy: 99.5,
        status: 'processing'
      },
      {
        id: 2,
        code: 'PD202403150002',
        createTime: '2024-03-15 14:00:00',
        operator: '李四',
        totalProducts: 80,
        accuracy: 100,
        status: 'completed'
      }
    ]
    total.value = 2
  } catch (error) {
    console.error('获取盘点列表失败:', error)
  }
  loading.value = false
}

// 获取状态类型
const getStatusType = (status) => {
  const map = {
    processing: 'warning',
    completed: 'success',
    cancelled: 'info'
  }
  return map[status]
}

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    processing: '进行中',
    completed: '已完成',
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
  queryParams.status = undefined
  queryParams.dateRange = []
  handleQuery()
}

// 新建盘点
const handleCreate = () => {
  // TODO: 获取商品列表
  form.products = [
    {
      id: 1,
      name: '商品A',
      specification: '500ml/瓶',
      unit: '瓶',
      systemStock: 100,
      actualStock: 100
    },
    {
      id: 2,
      name: '商品B',
      specification: '1kg/袋',
      unit: '袋',
      systemStock: 50,
      actualStock: 50
    }
  ]
  dialogVisible.value = true
}

// 查看详情
const handleDetail = (row) => {
  // TODO: 实现查看详情功能
  console.log('查看详情:', row)
}

// 完成盘点
const handleComplete = (row) => {
  ElMessageBox.confirm('确认要完成该盘点吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      // TODO: 调用后端API完成盘点
      ElMessage.success('盘点已完成')
      getList()
    } catch (error) {
      console.error('完成盘点失败:', error)
    }
  })
}

// 取消盘点
const handleCancel = (row) => {
  ElMessageBox.confirm('确认要取消该盘点吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      // TODO: 调用后端API取消盘点
      ElMessage.success('盘点已取消')
      getList()
    } catch (error) {
      console.error('取消盘点失败:', error)
    }
  })
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // TODO: 调用后端API创建盘点
        ElMessage.success('创建成功')
        dialogVisible.value = false
        getList()
      } catch (error) {
        console.error('创建盘点失败:', error)
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
})
</script>

<style scoped>
.stocktaking-container {
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

.dialog-footer {
  text-align: right;
}
</style> 