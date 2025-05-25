<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="选择商品"
    width="1200px"
    :before-close="handleClose"
    destroy-on-close
  >
    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="商品名称">
          <el-input 
            v-model="searchForm.name" 
            placeholder="请输入商品名称" 
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 商品列表 -->
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="productList"
      border
      style="width: 100%"
      @selection-change="handleSelectionChange"
      max-height="400px"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="code" label="商品编码" width="120" />
      <el-table-column prop="name" label="商品名称" min-width="150" />
      <el-table-column prop="brand" label="品牌" width="100" />
      <el-table-column prop="specification" label="规格" width="120" />
      <el-table-column prop="unit" label="单位" width="80" />
      <el-table-column prop="purchasePrice" label="采购价格" width="100">
        <template #default="{ row }">
          ¥{{ Number(row.purchasePrice || 0).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="retailPrice" label="零售价格" width="100">
        <template #default="{ row }">
          ¥{{ Number(row.retailPrice || 0).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column label="当前库存" width="100">
        <template #default="{ row }">
          {{ row.currentStock || 0 }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 已选商品信息 -->
    <div class="selected-info" v-if="selectedProducts.length > 0">
      <el-divider content-position="left">
        <span class="selected-title">已选择 {{ selectedProducts.length }} 个商品</span>
      </el-divider>
      <div class="selected-products">
        <el-tag
          v-for="product in selectedProducts"
          :key="product.id"
          closable
          @close="removeSelectedProduct(product)"
          class="selected-tag"
        >
          {{ product.name }} ({{ product.code }})
        </el-tag>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleConfirm"
          :disabled="selectedProducts.length === 0"
        >
          确定选择 ({{ selectedProducts.length }})
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getInventoryList } from '@/api/inventory'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  // 已选择的商品ID列表，用于回显
  selectedProductIds: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'confirm'])

// 响应式数据
const loading = ref(false)
const tableRef = ref(null)

// 搜索表单
const searchForm = reactive({
  name: ''
})

// 商品列表数据
const productList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 选中的商品
const selectedProducts = ref([])

// 监听 modelValue 变化，弹窗打开时加载数据
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    // 弹窗打开时重置数据并加载商品列表
    resetData()
    fetchProductList()
  }
})

// 重置数据
const resetData = () => {
  currentPage.value = 1
  selectedProducts.value = []
  searchForm.name = ''
}

// 获取商品列表
const fetchProductList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      productName: searchForm.name // 库存API使用productName参数搜索
    }
    
    const res = await getInventoryList(params)
    // 处理库存API返回的数据结构，将Product信息提取出来并添加库存信息
    productList.value = (res.data.list || []).map(inventory => ({
      id: inventory.Product.id,
      code: inventory.Product.code,
      name: inventory.Product.name,
      brand: inventory.Product.brand,
      specification: inventory.Product.specification,
      unit: inventory.Product.unit,
      purchasePrice: inventory.Product.purchasePrice,
      retailPrice: inventory.Product.retailPrice,
      currentStock: inventory.quantity // 从库存记录中获取当前库存
    }))
    total.value = res.data.total || 0
    
    // 如果有预选的商品ID，需要回显选中状态
    if (props.selectedProductIds.length > 0) {
      await nextTick()
      restoreSelection()
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

// 恢复选中状态
const restoreSelection = () => {
  if (!tableRef.value) return
  
  productList.value.forEach(product => {
    if (props.selectedProductIds.includes(product.id)) {
      tableRef.value.toggleRowSelection(product, true)
    }
  })
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchProductList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.name = ''
  handleSearch()
}

// 分页相关
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchProductList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchProductList()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedProducts.value = selection
}

// 移除选中的商品
const removeSelectedProduct = (product) => {
  if (tableRef.value) {
    tableRef.value.toggleRowSelection(product, false)
  }
}

// 确认选择
const handleConfirm = () => {
  if (selectedProducts.value.length === 0) {
    ElMessage.warning('请至少选择一个商品')
    return
  }
  
  // 返回选中的商品信息
  emit('confirm', selectedProducts.value)
  handleClose()
}

// 关闭弹窗
const handleClose = () => {
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.search-section {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  
  .search-form {
    margin: 0;
    
    :deep(.el-form-item) {
      margin-bottom: 0;
      margin-right: 16px;
    }
  }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.selected-info {
  margin-top: 20px;
  
  .selected-title {
    font-weight: 500;
    color: #409eff;
  }
  
  .selected-products {
    margin-top: 10px;
    
    .selected-tag {
      margin-right: 8px;
      margin-bottom: 8px;
    }
  }
}

.dialog-footer {
  text-align: right;
  
  .el-button + .el-button {
    margin-left: 12px;
  }
}
</style> 