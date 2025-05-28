<template>
  <ListPageLayout>
    <template #filter>
      <el-form :inline="true" :model="searchForm" class="filter-form">
        <el-form-item label="供应商名称">
          <el-input v-model="searchForm.name" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="searchForm.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="信用评级">
          <el-select 
            v-model="searchForm.creditRating" 
            placeholder="请选择信用评级" 
            clearable
            style="width: 150px"
            value-key="value"
          >
            <el-option 
              v-for="item in creditRatingOptions" 
              :key="item.value"
              :label="item.label" 
              :value="item.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="handleAdd">新增供应商</el-button>
        </el-form-item>
      </el-form>
    </template>

    <template #content>
      <!-- 供应商列表 -->
      <el-table
        v-loading="loading"
        :data="supplierList"
        border
        style="width: 100%"
      >
        <el-table-column prop="name" label="供应商名称" min-width="150" />
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column prop="creditRating" label="信用评级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getCreditRatingType(row.creditRating)">
              {{ getCreditRatingText(row.creditRating) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="120" />
        <el-table-column prop="manager" label="负责人" width="110">
          <template #default="{ row }">
            {{ getUserNameById(row.manager) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 供应商表单弹窗 -->
    <BaseDialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增供应商' : '编辑供应商'"
      :form-data="form"
      :rules="rules"
      :loading="submitting"
      @confirm="handleSubmit"
      @cancel="handleCancel"
    >
      <template #form="{ form: formData }">
        <el-form-item label="供应商名称" prop="name" required>
          <el-input v-model="formData.name" placeholder="请输入供应商名称" />
        </el-form-item>
        
        <el-form-item label="联系人" prop="contactPerson" required>
          <el-input v-model="formData.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
        
        <el-form-item label="联系电话" prop="phone" required>
          <el-input v-model="formData.phone" placeholder="请输入联系电话" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        
        <el-form-item label="信用评级" prop="creditRating">
          <el-select v-model="formData.creditRating" placeholder="请选择信用评级">
            <el-option label="AAA级" :value="5" />
            <el-option label="AA级" :value="4" />
            <el-option label="A级" :value="3" />
            <el-option label="B级" :value="2" />
            <el-option label="C级" :value="1" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="支付方式" prop="paymentMethod">
          <el-select v-model="formData.paymentMethod" placeholder="请选择支付方式">
            <el-option label="现金" value="cash" />
            <el-option label="银行转账" value="bank_transfer" />
            <el-option label="支票" value="check" />
            <el-option label="信用证" value="letter_of_credit" />
            <el-option label="月结" value="monthly_settlement" />
            <el-option label="季结" value="quarterly_settlement" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="负责人" prop="manager" required>
          <UserSelect v-model="formData.manager" />
        </el-form-item>
        
        <el-form-item label="地址" prop="address" required>
          <AddressSelect v-model="formData.address" />
        </el-form-item>
      </template>
    </BaseDialog>
  </ListPageLayout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSupplierList, createSupplier, updateSupplier, deleteSupplier } from '@/api/supplier'
import UserSelect from '@/components/UserSelect.vue'
import AddressSelect from '@/components/AddressSelect.vue'
import { useUserStore } from '@/stores/user'
import BaseDialog from '@/components/BaseDialog.vue'
import ListPageLayout from '@/components/ListPageLayout.vue'
import { formatDateTime } from '@/utils/date'
import { useUsers } from '@/composables/useUsers'

// 用户store
const userStore = useUserStore()

// 使用用户数据composable
const { userList, getAllUsers } = useUsers()

// 搜索表单
const searchForm = ref({
  name: '',
  contactPerson: '',
  creditRating: null
})

// 加载状态
const loading = ref(false)

// 供应商列表数据
const supplierList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 信用评级选项
const creditRatingOptions = [
  { label: 'AAA级', value: 5 },
  { label: 'AA级', value: 4 },
  { label: 'A级', value: 3 },
  { label: 'B级', value: 2 },
  { label: 'C级', value: 1 }
]

// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref('add') // add, edit
const submitting = ref(false)
const form = ref({
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  creditRating: null,
  paymentMethod: '',
  manager: null
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$|^(\d{3,4}-?)?\d{7,8}$/, message: '请输入正确的电话号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请选择或输入地址', trigger: 'blur' }
  ],
  manager: [
    { required: true, message: '请选择负责人', trigger: 'change' }
  ]
}

// 信用评级相关方法
const getCreditRatingText = (rating) => {
  const ratingMap = {
    5: 'AAA级',
    4: 'AA级',
    3: 'A级',
    2: 'B级',
    1: 'C级'
  }
  return ratingMap[rating] || '未评级'
}

const getCreditRatingType = (rating) => {
  if (rating >= 4) return 'success'
  if (rating >= 3) return 'warning'
  if (rating >= 2) return 'info'
  return 'danger'
}

// 获取供应商列表
const fetchSupplierList = async() => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm.value
    }
    const res = await getSupplierList(params)
    supplierList.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchSupplierList()
}

// 重置搜索
const resetSearch = () => {
  console.log('重置搜索前:', searchForm.value)
  searchForm.value = {
    name: '',
    contactPerson: '',
    creditRating: null
  }
  console.log('重置搜索后:', searchForm.value)
  handleSearch()
}

// 新增供应商
const handleAdd = async() => {
  try {
    dialogType.value = 'add'
    
    // 确保用户列表已加载
    if (userList.value.length === 0) {
      const loading = ElMessage.loading('加载用户数据中...')
      await getAllUsers()
      loading.close()
    }
    
    // 获取当前登录用户ID作为默认负责人
    const currentUserId = userStore.userInfo?.id || null
    console.log('当前登录用户ID:', currentUserId, '用户信息:', userStore.userInfo)
    
    form.value = {
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      creditRating: null,
      paymentMethod: '',
      manager: currentUserId
    }
    dialogVisible.value = true
  } catch (error) {
    console.error('打开新增弹窗失败:', error)
  }
}

// 编辑供应商
const handleEdit = async(row) => {
  try {
    dialogType.value = 'edit'
    
    // 确保用户列表已加载
    if (userList.value.length === 0) {
      const loading = ElMessage.loading('加载用户数据中...')
      await getAllUsers()
      loading.close()
    }
    
    // 确保manager字段为数字类型
    const editData = { ...row }
    if (editData.manager) {
      editData.manager = parseInt(editData.manager)
    }
    
    form.value = editData
    dialogVisible.value = true
  } catch (error) {
    console.error('打开编辑弹窗失败:', error)
  }
}

// 删除供应商
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该供应商吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async() => {
    try {
      await deleteSupplier(row.id)
      ElMessage.success('删除成功')
      fetchSupplierList()
    } catch (error) {
      console.error('删除供应商失败:', error)
    }
  })
}

// 提交表单
const handleSubmit = async(formData) => {
  submitting.value = true
  try {
    if (dialogType.value === 'add') {
      await createSupplier(formData)
      ElMessage.success('新增成功')
    } else {
      await updateSupplier(formData.id, formData)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    fetchSupplierList()
  } catch (error) {
    console.error('保存供应商失败:', error)
  } finally {
    submitting.value = false
  }
}

// 取消弹窗
const handleCancel = () => {
  dialogVisible.value = false
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchSupplierList()
}

// 页码改变
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchSupplierList()
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return formatDateTime(date)
}

// 获取用户名
const getUserNameById = (userId) => {
  if (!userId) return '未分配'
  const user = userList.value.find(u => u.id === parseInt(userId))
  return user ? user.fullname : '未知用户'
}

onMounted(async() => {
  // 获取供应商列表和用户列表
  fetchSupplierList()
  getAllUsers()
  
  // 确保当前用户信息已加载
  if (!userStore.userInfo?.id) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      console.error('获取当前用户信息失败:', error)
    }
  }
})

// 调试：监听searchForm变化
watch(searchForm, (newVal) => {
  console.log('searchForm变化:', newVal)
}, { deep: true })
</script> 
