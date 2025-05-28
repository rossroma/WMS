<template>
  <ListPageLayout>
    <template #filter>
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px" class="filter-form">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="queryParams.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="queryParams.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="queryParams.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="用户状态" clearable style="width: 100px;">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button type="primary" :icon="CirclePlus" @click="handleAdd" class="add-button-on-filter">新增用户</el-button>
        </el-form-item>
      </el-form>
    </template>

    <template #content>
      <el-table :data="userList" v-loading="loading" border style="width: 100%; margin-top: 16px;">
        <el-table-column prop="username" label="用户名" align="center" />
        <el-table-column prop="email" label="邮箱" align="center" />
        <el-table-column prop="phone" label="手机号码" align="center" />
        <el-table-column prop="fullname" label="姓名" align="center" />
        <el-table-column label="角色" min-width="150" align="center">
          <template #default="{ row }">
            <el-tag
              class="role-tag"
              :type="getRoleTagType(row.role)"
            >
              {{ getRoleDisplayName(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" size="small" text @click="openChangePasswordDialog(row)">修改密码</el-button>
            <el-button type="danger" size="small" text @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination" v-if="total > 0">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </template>

    <!-- 用户表单对话框 (使用 BaseDialog) -->
    <BaseDialog
      v-model="userFormDialog.visible"
      :title="userFormDialog.title"
      :form-data="userFormDialog.data" 
      :rules="userFormDialog.rules" 
      :loading="userFormDialog.submitting"
      @confirm="submitUserForm"
      width="600px"
    >
      <template #form="{ form }"> 
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="userFormDialog.isEdit" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="姓名" prop="fullname">
          <el-input v-model="form.fullname" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role">
            <el-option label="超级管理员" value="admin" />
            <el-option label="管理员" value="manager" />
            <el-option label="操作员" value="operator" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!userFormDialog.isEdit" :required="!userFormDialog.isEdit">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
      </template>
    </BaseDialog>

    <!-- 修改密码对话框 -->
    <el-dialog
      title="修改密码"
      v-model="changePasswordDialog.visible"
      width="500px"
      append-to-body
      destroy-on-close
      draggable
    >
      <el-form
        ref="passwordFormRef"
        :model="changePasswordDialog.form"
        :rules="changePasswordDialog.rules"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="changePasswordDialog.form.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="changePasswordDialog.form.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="changePasswordDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitChangePassword" :loading="changePasswordDialog.submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </ListPageLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, CirclePlus } from '@element-plus/icons-vue'
import ListPageLayout from '@/components/ListPageLayout.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import { getUserList, createUser, updateUser, deleteUser, changeUserPassword } from '@/api/user'

const loading = ref(false)
const userList = ref([])
const total = ref(0)

const queryFormRef = ref() 
const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  username: undefined,
  email: undefined,
  phone: undefined,
  status: undefined
})

// --- 用户表单弹窗 (BaseDialog) ---
const userFormDialog = reactive({
  visible: false,
  title: '',
  isEdit: false,
  submitting: false,
  data: {
    id: undefined,
    username: '',
    email: '',
    phone: '',
    fullname: '',
    role: 'operator',
    status: 'active',
    password: ''
  },
  rules: {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
    ],
    phone: [
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
    ],
    fullname: [
      { required: true, message: '请输入姓名', trigger: 'blur' }
    ],
    role: [
      { required: true, message: '请选择角色', trigger: 'change' }
    ],
    password: [
      { 
        validator: (rule, value, callback) => {
          if (!userFormDialog.isEdit && !value) {
            callback(new Error('请输入密码'))
          } else if (value && value.length < 6) {
            callback(new Error('密码长度不能小于6位'))
          } else {
            callback()
          }
        },
        trigger: 'blur' 
      }
    ]
  }
})

const handleAdd = () => {
  userFormDialog.isEdit = false
  userFormDialog.title = '新增用户'
  userFormDialog.data = {
    id: undefined,
    username: '',
    email: '',
    phone: '',
    fullname: '',
    role: 'operator',
    status: 'active',
    password: ''
  }
  userFormDialog.visible = true
}

const handleEdit = (row) => {
  userFormDialog.isEdit = true
  userFormDialog.title = '编辑用户'
  userFormDialog.data = { ...row, password: '' }
  userFormDialog.visible = true
}

const submitUserForm = async(formDataFromDialog) => { 
  userFormDialog.submitting = true
  try {
    const dataToSubmit = { ...formDataFromDialog }
    if (!userFormDialog.isEdit && !dataToSubmit.password) {
      ElMessage.error('新增用户时必须填写密码')
      userFormDialog.submitting = false
      return
    }
    if (userFormDialog.isEdit && dataToSubmit.password === '') {
      delete dataToSubmit.password
    }

    if (userFormDialog.isEdit) {
      await updateUser(dataToSubmit.id, dataToSubmit)
      ElMessage.success('用户更新成功')
    } else {
      await createUser(dataToSubmit)
      ElMessage.success('用户创建成功')
    }
    userFormDialog.visible = false
    fetchUserList()
  } catch (error) {
    console.error('用户操作失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '用户操作失败')
  } finally {
    userFormDialog.submitting = false
  }
}

// --- 修改密码弹窗 ---
const passwordFormRef = ref() 
const changePasswordDialog = reactive({
  visible: false,
  submitting: false,
  userId: null,
  form: {
    newPassword: '',
    confirmPassword: ''
  },
  rules: {
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请确认密码', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (value !== changePasswordDialog.form.newPassword) {
            callback(new Error('两次输入的密码不一致'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }
})

const openChangePasswordDialog = (row) => {
  changePasswordDialog.userId = row.id
  changePasswordDialog.form.newPassword = ''
  changePasswordDialog.form.confirmPassword = ''
  if (passwordFormRef.value) {
    passwordFormRef.value.resetFields()
  }
  changePasswordDialog.visible = true
}

const submitChangePassword = async() => {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async(valid) => {
    if (valid) {
      changePasswordDialog.submitting = true
      try {
        await changeUserPassword(changePasswordDialog.userId, { newPassword: changePasswordDialog.form.newPassword })
        ElMessage.success('密码修改成功')
        changePasswordDialog.visible = false
      } catch (error) {
        console.error('密码修改失败:', error)
        ElMessage.error(error.response?.data?.message || error.message || '密码修改失败')
      } finally {
        changePasswordDialog.submitting = false
      }
    }
  })
}

// --- 通用逻辑 ---
const fetchUserList = async() => {
  loading.value = true
  try {
    const res = await getUserList(queryParams)
    userList.value = Array.isArray(res.data?.list) ? res.data.list : (Array.isArray(res.data) ? res.data : [])
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error(error.message || '获取用户列表失败')
    userList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNum = 1
  fetchUserList()
}

const resetQuery = () => {
  if (queryFormRef.value) {
    queryFormRef.value.resetFields()
  }
  queryParams.username = undefined
  queryParams.email = undefined
  queryParams.phone = undefined
  queryParams.status = undefined
  queryParams.pageNum = 1
  fetchUserList()
}

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  fetchUserList()
}

const handleCurrentChange = (val) => {
  queryParams.pageNum = val
  fetchUserList()
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除用户 "${row.username}" 吗?`,
    '系统提示',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async() => {
    try {
      await deleteUser(row.id)
      ElMessage.success('删除成功')
      fetchUserList()
    } catch (error) {
      console.error('删除用户失败:', error)
      ElMessage.error(error.response?.data?.message || error.message || '删除用户失败')
    }
  }).catch(() => { /* User clicked cancel or closed dialog */ })
}

const getRoleTagType = (roleName) => {
  if (!roleName) return 'info'
  const nameLower = roleName.toLowerCase()
  if (nameLower.includes('admin') || nameLower.includes('超级')) return 'danger'
  if (nameLower.includes('manager') || nameLower.includes('管理')) return 'warning'
  return 'primary'
}

const getRoleDisplayName = (roleName) => {
  if (!roleName) return '未知角色'
  const nameLower = roleName.toLowerCase()
  if (nameLower.includes('admin') || nameLower.includes('超级')) return '超级管理员'
  if (nameLower.includes('manager') || nameLower.includes('管理')) return '管理员'
  if (nameLower.includes('operator') || nameLower.includes('操作')) return '操作员'
  return roleName
}

onMounted(() => {
  fetchUserList()
})

</script>

<style scoped lang="scss">
.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.role-tag {
  margin-right: 5px;
  margin-bottom: 5px; 
}

/* Styles for filter-form and pagination are expected to be handled by ListPageLayout */
</style> 
