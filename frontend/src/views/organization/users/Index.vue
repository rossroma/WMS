<template>
  <div class="users-container">
    <div class="header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="handleAdd">新增用户</el-button>
    </div>

    <el-table :data="userList" v-loading="loading" border>
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="phone" label="手机号码" />
      <el-table-column prop="fullname" label="姓名" />
      <el-table-column label="角色" min-width="200">
        <template #default="{ row }">
          <el-tag
            v-for="role in row.roles"
            :key="role.name"
            class="role-tag"
            :type="getRoleTagType(role.name)"
          >
            {{ role.description }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="320">
        <template #default="{ row }">
          <el-button-group>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handleAssignRoles(row)">分配角色</el-button>
            <el-button type="primary" link @click="handleChangePassword(row)">修改密码</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 用户表单对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="form.id !== undefined" />
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
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!form.id">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog
      title="修改密码"
      v-model="passwordDialogVisible"
      width="500px"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePasswordSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 角色分配对话框 -->
    <el-dialog
      title="分配角色"
      v-model="roleDialogVisible"
      width="500px"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        label-width="80px"
      >
        <el-form-item label="用户名">
          <span>{{ roleForm.username }}</span>
        </el-form-item>
        <el-form-item label="角色">
          <el-checkbox-group v-model="roleForm.selectedRoles">
            <el-checkbox
              v-for="role in roleList"
              :key="role.id"
              :label="role.id"
            >
              {{ role.name }} ({{ role.description }})
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRoleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, createUser, updateUser, deleteUser, changeUserPassword } from '@/api/user'
import { getRoleList, assignRoles } from '@/api/role'

const loading = ref(false)
const submitting = ref(false)
const userList = ref([])
const dialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const roleDialogVisible = ref(false)
const formRef = ref()
const passwordFormRef = ref()
const roleFormRef = ref()

const form = reactive({
  username: '',
  email: '',
  phone: '',
  fullname: '',
  status: 'active',
  password: ''
})

const passwordForm = reactive({
  userId: undefined,
  newPassword: '',
  confirmPassword: ''
})

const roleForm = reactive({
  userId: undefined,
  username: '',
  selectedRoles: []
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  fullname: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ]
}

const passwordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const dialogTitle = computed(() => form.id ? '编辑用户' : '新增用户')

const roleList = ref([])

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  try {
    const res = await getUserList()
    userList.value = res.data
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取角色列表
const fetchRoleList = async () => {
  try {
    const res = await getRoleList()
    roleList.value = res
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

// 新增用户
const handleAdd = () => {
  Object.assign(form, {
    username: '',
    email: '',
    phone: '',
    fullname: '',
    status: 'active',
    password: ''
  })
  dialogVisible.value = true
}

// 编辑用户
const handleEdit = (row) => {
  Object.assign(form, row)
  dialogVisible.value = true
}

// 修改密码
const handleChangePassword = (row) => {
  passwordForm.userId = row.id
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordDialogVisible.value = true
}

// 删除用户
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该用户吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteUser(row.id)
      ElMessage.success('删除成功')
      fetchUserList()
    } catch (error) {
      console.error('删除用户失败:', error)
    }
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (form.id) {
          await updateUser(form.id, form)
          ElMessage.success('更新成功')
        } else {
          await createUser(form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        fetchUserList()
      } catch (error) {
        console.error('保存用户失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 提交修改密码
const handlePasswordSubmit = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await changeUserPassword(passwordForm.userId, {
          newPassword: passwordForm.newPassword
        })
        ElMessage.success('密码修改成功')
        passwordDialogVisible.value = false
      } catch (error) {
        console.error('修改密码失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 打开角色分配对话框
const handleAssignRoles = async (row) => {
  roleForm.userId = row.id
  roleForm.username = row.username
  roleForm.selectedRoles = row.roles.map(role => role.id)
  roleDialogVisible.value = true
}

// 提交角色分配
const handleRoleSubmit = async () => {
  if (!roleForm.userId) return
  
  submitting.value = true
  try {
    await assignRoles(roleForm.userId, {
      roleIds: roleForm.selectedRoles
    })
    ElMessage.success('角色分配成功')
    roleDialogVisible.value = false
    fetchUserList()
  } catch (error) {
    console.error('角色分配失败:', error)
  } finally {
    submitting.value = false
  }
}

// 根据角色名称返回标签类型
const getRoleTagType = (roleName) => {
  const typeMap = {
    'admin': 'danger',
    'manager': 'warning',
    'user': 'info'
  }
  return typeMap[roleName] || 'info'
}

onMounted(() => {
  fetchUserList()
  fetchRoleList()
})
</script>

<style scoped>
.users-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
}

.role-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}

.role-tag:last-child {
  margin-right: 0;
}

.el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.el-checkbox {
  margin-right: 0;
}
</style> 