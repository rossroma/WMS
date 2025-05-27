<template>
  <ListPageLayout>
    <template #filter>
      <el-form :inline="true" :model="searchForm" class="filter-form">
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="品牌">
          <el-input v-model="searchForm.brand" placeholder="请输入品牌" />
        </el-form-item>
        <el-form-item label="商品分类">
          <el-cascader
            v-model="searchForm.categoryId"
            :options="categoryOptions"
            :props="{ checkStrictly: true, value: 'id', label: 'name' }"
            placeholder="请选择商品分类"
            style="width: 150px"
            clearable
          />
        </el-form-item>
        <el-form-item label="供应商">
          <el-select 
            v-model="searchForm.supplierId" 
            placeholder="请选择供应商" 
            clearable
            value-key="id"
            style="width: 150px"
            filterable
          >
            <el-option
              v-for="supplier in supplierOptions"
              :key="supplier.id"
              :label="supplier.name"
              :value="supplier.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button v-if="canEditProduct" type="primary" @click="handleAdd">新增商品</el-button>
          <el-button v-if="canEditProduct" @click="handleCategoryManage">分类管理</el-button>
        </el-form-item>
      </el-form>
    </template>

    <template #content>
      <!-- 商品列表 -->
      <el-table
        v-loading="loading"
        :data="productList"
        border
        style="width: 100%"
      >
        <el-table-column prop="name" label="商品名称" min-width="150" />
        <el-table-column label="图片" width="80" align="center">
          <template #default="{ row }">
            <div class="product-image-cell">
              <el-image 
                v-if="row.image"
                :src="getListThumbnail(row.image)"
                :preview-src-list="[row.image]"
                :initial-index="0"
                fit="cover"
                class="product-image"
                preview-teleported
              />
              <span v-else class="no-image">暂无图片</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="商品编码" width="120" />
        <el-table-column prop="brand" label="品牌" width="120" />
        <el-table-column label="商品分类" width="150">
          <template #default="{ row }">
            {{ row.Category?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="specification" label="规格" width="120" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="采购价格" width="100">
          <template #default="{ row }">
            ¥{{ row.purchasePrice?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column label="零售价格" width="100">
          <template #default="{ row }">
            ¥{{ row.retailPrice?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column label="供应商" width="150">
          <template #default="{ row }">
            {{ row.Supplier?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="warehouse" label="仓库" width="100" />
        <el-table-column prop="stockAlertQuantity" label="预警库存" width="100" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="canEditProduct" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="canEditProduct" link type="success" @click="handleCopy(row)">复制</el-button>
            <el-button v-if="canEditProduct" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </template>

    <!-- 商品表单弹窗 -->
    <BaseDialog
      v-model="dialogVisible"
      :title="getDialogTitle()"
      :form-data="form"
      :rules="rules"
      :loading="submitting"
      @confirm="handleSubmit"
      @cancel="handleCancel"
    >
      <template #form="{ form: formData }">
        <el-form-item label="商品名称" prop="name" required>
          <el-input v-model="formData.name" placeholder="请输入商品名称" />
        </el-form-item>
        
        <el-form-item label="商品编码" prop="code" required>
          <el-input v-model="formData.code" placeholder="请输入商品编码" />
        </el-form-item>
        
        <el-form-item label="品牌" prop="brand">
          <el-input v-model="formData.brand" placeholder="请输入品牌" />
        </el-form-item>
        
        <el-form-item label="规格" prop="specification">
          <el-input v-model="formData.specification" placeholder="请输入规格" />
        </el-form-item>
        
        <el-form-item label="单位" prop="unit">
          <el-input v-model="formData.unit" placeholder="请输入单位，如：个、件、台" />
        </el-form-item>
        
        <el-form-item label="仓库" prop="warehouse">
          <el-input v-model="formData.warehouse" placeholder="请输入仓库位置" />
        </el-form-item>

        <el-form-item label="商品分类" prop="categoryId">
          <el-cascader
            v-model="formData.categoryId"
            :options="categoryOptions"
            :props="{ checkStrictly: true, value: 'id', label: 'name' }"
            placeholder="请选择商品分类"
          />
        </el-form-item>
        
        <el-form-item label="供应商" prop="supplierId">
          <el-select 
            v-model="formData.supplierId" 
            placeholder="请选择供应商" 
            value-key="id"
            filterable
            clearable
          >
            <el-option
              v-for="supplier in supplierOptions"
              :key="supplier.id"
              :label="supplier.name"
              :value="supplier.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="采购价格" prop="purchasePrice" required>
          <el-input-number
            v-model="formData.purchasePrice"
            :precision="2"
            :step="0.1"
            :min="0"
            placeholder="请输入采购价格"
          />
        </el-form-item>
        
        <el-form-item label="零售价格" prop="retailPrice">
          <el-input-number
            v-model="formData.retailPrice"
            :precision="2"
            :step="0.1"
            :min="0"
            placeholder="请输入零售价格"
          />
        </el-form-item>

        <el-form-item label="库存预警数量" prop="stockAlertQuantity">
          <el-input-number
            v-model="formData.stockAlertQuantity"
            :min="0"
            placeholder="请输入库存预警数量"
          />
        </el-form-item>
        
        <el-form-item label="图片" prop="image">
          <ImageUpload v-model="formData.image" />
        </el-form-item>

        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入商品描述"
          />
        </el-form-item>
      </template>
    </BaseDialog>

    <!-- 分类管理全屏弹窗 -->
    <el-dialog
      v-model="categoryDialogVisible"
      title="分类管理"
      fullscreen
      :destroy-on-close="true"
    >
      <category-management @close="categoryDialogVisible = false" />
    </el-dialog>
  </ListPageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProductList, createProduct, updateProduct, deleteProduct } from '@/api/product'
import { getCategoryTree } from '@/api/category'
import { getSupplierList } from '@/api/supplier'
import CategoryManagement from '@/components/CategoryManagement/index.vue'
import { useUserStore } from '@/stores/user'
import BaseDialog from '@/components/BaseDialog.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import { getListThumbnail } from '@/utils/image'
import ListPageLayout from '@/components/ListPageLayout.vue'
import { hasRolePermission } from '@/utils/permission'

const userStore = useUserStore()

const canEditProduct = hasRolePermission('manager')

// 搜索表单
const searchForm = ref({
  name: '',
  brand: '',
  categoryId: null,
  supplierId: null
})

// 选项数据
const categoryOptions = ref([])
const supplierOptions = ref([])

// 加载状态
const loading = ref(false)

// 商品列表数据
const productList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const submitting = ref(false)
const isCopy = ref(false)
const form = ref({
  name: '',
  brand: '',
  code: '',
  specification: '',
  unit: '',
  warehouse: '',
  categoryId: null,
  supplierId: null,
  purchasePrice: null,
  retailPrice: null,
  stockAlertQuantity: null,
  image: '',
  description: '',
  createdBy: ''
})

// 分类管理弹窗
const categoryDialogVisible = ref(false)

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入商品编码', trigger: 'blur' }],
  purchasePrice: [{ required: true, message: '请输入采购价格', trigger: 'blur' }]
}

// 获取分类树
const fetchCategoryTree = async () => {
  try {
    const res = await getCategoryTree()
    categoryOptions.value = res.data
  } catch (error) {
    console.error('获取分类树失败:', error)
  }
}

// 获取供应商列表
const fetchSupplierList = async () => {
  try {
    const res = await getSupplierList()
    const suppliers = res.data.list || res.data || []
    // 确保所有 id 都是数字类型
    supplierOptions.value = suppliers.map(supplier => ({
      ...supplier,
      id: Number(supplier.id)
    }))
    console.log('供应商列表加载完成:', supplierOptions.value)
  } catch (error) {
    console.error('获取供应商列表失败:', error)
    supplierOptions.value = []
  }
}

// 获取商品列表
const fetchProductList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm.value
    }
    const res = await getProductList(params)
    productList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取商品列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchProductList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    name: '',
    brand: '',
    categoryId: null,
    supplierId: null
  }
  console.log('重置搜索表单:', searchForm.value)
  handleSearch()
}

// 新增商品
const handleAdd = () => {
  dialogType.value = 'add'
  isCopy.value = false
  form.value = {
    name: '',
    brand: '',
    code: '',
    specification: '',
    unit: '',
    warehouse: '',
    categoryId: null,
    supplierId: null,
    purchasePrice: null,
    retailPrice: null,
    stockAlertQuantity: null,
    image: '',
    description: '',
    createdBy: userStore.user?.username || ''
  }
  dialogVisible.value = true
}

// 编辑商品
const handleEdit = (row) => {
  dialogType.value = 'edit'
  isCopy.value = false
  form.value = { 
    ...row,
    // 确保关联字段的数据类型正确
    supplierId: row.supplierId ? Number(row.supplierId) : null,
    categoryId: row.categoryId ? Number(row.categoryId) : null
  }
  console.log('编辑商品数据:', form.value)
  dialogVisible.value = true
}

// 复制商品
const handleCopy = async (row) => {
  try {
    dialogType.value = 'add'
    isCopy.value = true
    
    // 确保供应商和分类数据已加载
    if (supplierOptions.value.length === 0) {
      await fetchSupplierList()
    }
    if (categoryOptions.value.length === 0) {
      await fetchCategoryTree()
    }
    
    // 复制商品数据但清空某些字段
    form.value = {
      // 复制基本信息
      name: `${row.name} - 副本`,
      brand: row.brand || '',
      specification: row.specification || '',
      unit: row.unit || '',
      warehouse: row.warehouse || '',
      purchasePrice: row.purchasePrice || null,
      retailPrice: row.retailPrice || null,
      stockAlertQuantity: row.stockAlertQuantity || null,
      image: row.image || '',
      description: row.description || '',
      // 复制关联信息
      supplierId: row.supplierId ? Number(row.supplierId) : null,
      categoryId: row.categoryId ? Number(row.categoryId) : null,
      // 清空需要重新填写的字段
      code: '', // 商品编码需要重新填写
      createdBy: userStore.user?.username || ''
    }
    
    console.log('复制商品数据:', form.value)
    dialogVisible.value = true
    
    // 提示用户
    ElMessage.info('已复制商品信息，请修改商品编码后保存')
  } catch (error) {
    console.error('复制商品失败:', error)
    ElMessage.error('复制商品失败')
  }
}

// 删除商品
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteProduct(row.id)
      ElMessage.success('删除成功')
      fetchProductList()
    } catch (error) {
      console.error('删除商品失败:', error)
    }
  })
}

// 提交表单
const handleSubmit = async (formData) => {
  submitting.value = true
  try {
    if (dialogType.value === 'add') {
      await createProduct(formData)
      if (isCopy.value) {
        ElMessage.success('复制商品成功')
      } else {
        ElMessage.success('新增商品成功')
      }
    } else {
      await updateProduct(formData.id, formData)
      ElMessage.success('更新商品成功')
    }
    dialogVisible.value = false
    isCopy.value = false // 重置复制状态
    fetchProductList()
  } catch (error) {
    console.error('保存商品失败:', error)
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchProductList()
}

// 页码改变
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchProductList()
}

// 打开分类管理
const handleCategoryManage = () => {
  categoryDialogVisible.value = true
}

// 取消弹窗
const handleCancel = () => {
  dialogVisible.value = false
  isCopy.value = false
}

// 获取对话框标题
const getDialogTitle = () => {
  if (dialogType.value === 'edit') {
    return '编辑商品'
  }
  return isCopy.value ? '复制商品' : '新增商品'
}

onMounted(() => {
  fetchCategoryTree()
  fetchSupplierList()
  fetchProductList()
})
</script>

<style lang="scss" scoped>
// 商品图片显示样式
.product-image-cell {
  display: flex;
  align-items: center;
  justify-content: center;

  .product-image {
    width: 40px;
    height: 40px;
    border-radius: 2px;
    cursor: pointer;
    border: 1px solid #e4e7ed;
    transition: all 0.2s;

    &:hover {
      border-color: #409eff;
      transform: scale(1.1);
    }
  }

  .no-image {
    color: #c0c4cc;
    font-size: 12px;
    text-align: center;
  }
}

// 无权限提示文本样式
.no-permission-text {
  color: #909399;
  font-size: 12px;
  font-style: italic;
}
</style> 