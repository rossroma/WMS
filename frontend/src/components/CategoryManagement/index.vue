<template>
  <div class="category-management">
    <div class="header">
      <h2>分类管理</h2>
      <div class="actions">
        <el-button type="primary" @click="handleAdd(null)">
          <el-icon><Plus /></el-icon>
          添加一级分类
        </el-button>
      </div>
    </div>

    <div class="content">
      <div class="category-tree">
        <!-- 一级分类拖拽容器 -->
        <draggable
          v-model="categoryList"
          group="root"
          item-key="id"
          handle=".drag-handle"
          @start="onDragStart"
          @end="handleDragEnd"
          :animation="200"
          ghost-class="sortable-ghost"
          chosen-class="sortable-chosen"
        >
          <template #item="{ element }">
            <div class="category-item">
              <!-- 一级分类 -->
              <div class="category-row level-1" :class="{ 'is-dragging': isDragging }">
                <div class="category-content">
                  <div class="left-section">
                    <!-- 展开/收起按钮 -->
                    <el-icon 
                      v-if="element.children && element.children.length > 0"
                      class="expand-icon"
                      :class="{ 'is-expanded': isExpanded(element.id) }"
                      @click="toggleExpand(element.id)"
                    >
                      <ArrowRight />
                    </el-icon>
                    <span v-else class="expand-placeholder" />
                    
                    <!-- 分类名称 -->
                    <span class="category-name">{{ element.name }}</span>
                  </div>
                  
                  <div class="right-section">
                    <!-- 操作按钮 -->
                    <div class="category-actions">
                      <el-button link type="primary" size="small" @click="handleAdd(element.id)">
                        添加子分类
                      </el-button>
                      <el-button link type="primary" size="small" @click="handleEdit(element)">
                        编辑
                      </el-button>
                      <el-button link type="danger" size="small" @click="handleDelete(element)">
                        删除
                      </el-button>
                    </div>
                    
                    <!-- 拖拽按钮 -->
                    <el-icon class="drag-handle" title="拖拽排序">
                      <Rank />
                    </el-icon>
                  </div>
                </div>
              </div>
              
              <!-- 二级分类 -->
              <div 
                v-if="element.children && element.children.length > 0" 
                v-show="isExpanded(element.id)"
                class="children-container"
              >
                <draggable
                  v-model="element.children"
                  :group="`children-${element.id}`"
                  item-key="id"
                  handle=".drag-handle"
                  @start="onDragStart"
                  @end="(evt) => handleChildDragEnd(evt, element.id)"
                  :animation="200"
                  ghost-class="sortable-ghost"
                  chosen-class="sortable-chosen"
                >
                  <template #item="{ element: child }">
                    <div class="child-wrapper">
                      <div class="category-row level-2" :class="{ 'is-dragging': isDragging }">
                        <div class="category-content">
                          <div class="left-section">
                            <!-- 展开/收起按钮 -->
                            <el-icon 
                              v-if="child.children && child.children.length > 0"
                              class="expand-icon"
                              :class="{ 'is-expanded': isExpanded(child.id) }"
                              @click="toggleExpand(child.id)"
                            >
                              <ArrowRight />
                            </el-icon>
                            <span v-else class="expand-placeholder" />
                            
                            <!-- 分类名称 -->
                            <span class="category-name">{{ child.name }}</span>
                          </div>
                          
                          <div class="right-section">
                            <!-- 操作按钮 -->
                            <div class="category-actions">
                              <el-button link type="primary" size="small" @click="handleAdd(child.id)">
                                添加子分类
                              </el-button>
                              <el-button link type="primary" size="small" @click="handleEdit(child)">
                                编辑
                              </el-button>
                              <el-button link type="danger" size="small" @click="handleDelete(child)">
                                删除
                              </el-button>
                            </div>
                            
                            <!-- 拖拽按钮 -->
                            <el-icon class="drag-handle" title="拖拽排序">
                              <Rank />
                            </el-icon>
                          </div>
                        </div>
                      </div>
                      
                      <!-- 三级分类 -->
                      <div 
                        v-if="child.children && child.children.length > 0" 
                        v-show="isExpanded(child.id)"
                        class="children-container level-3"
                      >
                        <draggable
                          v-model="child.children"
                          :group="`children-${child.id}`"
                          item-key="id"
                          handle=".drag-handle"
                          @start="onDragStart"
                          @end="(evt) => handleChildDragEnd(evt, child.id)"
                          :animation="200"
                          ghost-class="sortable-ghost"
                          chosen-class="sortable-chosen"
                        >
                          <template #item="{ element: grandChild }">
                            <div class="category-row level-3" :class="{ 'is-dragging': isDragging }">
                              <div class="category-content">
                                <div class="left-section">
                                  <span class="expand-placeholder" />
                                  <span class="category-name">{{ grandChild.name }}</span>
                                </div>
                                
                                <div class="right-section">
                                  <!-- 操作按钮 -->
                                  <div class="category-actions">
                                    <el-button link type="primary" size="small" @click="handleEdit(grandChild)">
                                      编辑
                                    </el-button>
                                    <el-button link type="danger" size="small" @click="handleDelete(grandChild)">
                                      删除
                                    </el-button>
                                  </div>
                                  
                                  <!-- 拖拽按钮 -->
                                  <el-icon class="drag-handle" title="拖拽排序">
                                    <Rank />
                                  </el-icon>
                                </div>
                              </div>
                            </div>
                          </template>
                        </draggable>
                      </div>
                    </div>
                  </template>
                </draggable>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- 添加/编辑分类弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加分类' : '编辑分类'"
      width="500px"
      :before-close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入分类名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item v-if="form.parentId" label="父分类">
          <el-input :value="getParentCategoryName(form.parentId)" readonly />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确 定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Rank, ArrowRight } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { getCategoryTree, createCategory, updateCategory, deleteCategory, batchUpdateSort } from '@/api/category'

const _emit = defineEmits(['close'])

// 数据相关
const loading = ref(false)
const categoryList = ref([])
const categoryMap = ref(new Map()) // 用于快速查找分类信息

// 展开状态管理
const expandedKeys = ref(new Set())
const isDragging = ref(false)

// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const submitting = ref(false)
const formRef = ref(null)
const form = ref({
  id: null,
  name: '',
  parentId: null
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '分类名称长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 展开/收起相关方法
const isExpanded = (id) => {
  return expandedKeys.value.has(id)
}

const toggleExpand = (id) => {
  if (expandedKeys.value.has(id)) {
    expandedKeys.value.delete(id)
  } else {
    expandedKeys.value.add(id)
  }
}

// 默认展开所有分类
const expandAll = () => {
  const traverse = (items) => {
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        expandedKeys.value.add(item.id)
        traverse(item.children)
      }
    })
  }
  traverse(categoryList.value)
}

// 拖拽开始
const onDragStart = () => {
  isDragging.value = true
}

// 获取分类树数据
const fetchCategoryTree = async() => {
  loading.value = true
  try {
    const res = await getCategoryTree()
    categoryList.value = res.data || []
    
    // 构建分类映射，方便查找
    buildCategoryMap(categoryList.value)
    
    // 默认展开所有分类
    expandAll()
  } catch (error) {
    console.error('获取分类数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 构建分类映射
const buildCategoryMap = (categories) => {
  categoryMap.value.clear()
  const traverse = (items) => {
    items.forEach(item => {
      categoryMap.value.set(item.id, item)
      if (item.children && item.children.length > 0) {
        traverse(item.children)
      }
    })
  }
  traverse(categories)
}

// 获取父分类名称
const getParentCategoryName = (parentId) => {
  const parent = categoryMap.value.get(parentId)
  return parent ? parent.name : ''
}

// 处理一级分类拖拽结束
const handleDragEnd = async(evt) => {
  isDragging.value = false
  if (evt.oldIndex === evt.newIndex) return
  
  try {
    const items = categoryList.value.map((item, index) => ({
      id: item.id,
      sort: index + 1
    }))
    
    await batchUpdateSort({ items })
    ElMessage.success('排序更新成功')
    fetchCategoryTree()
  } catch (error) {
    console.error('批量更新排序失败:', error)
    // 重新获取数据恢复原状态
    fetchCategoryTree()
  }
}

// 处理子分类拖拽结束
const handleChildDragEnd = async(evt, parentId) => {
  isDragging.value = false
  if (evt.oldIndex === evt.newIndex) return
  
  try {
    // 找到对应的父分类
    const findParentAndChildren = (categories, targetParentId) => {
      for (const category of categories) {
        if (category.id === targetParentId) {
          return category.children || []
        }
        if (category.children) {
          const result = findParentAndChildren(category.children, targetParentId)
          if (result) return result
        }
      }
      return null
    }
    
    const children = findParentAndChildren(categoryList.value, parentId)
    if (children) {
      const items = children.map((item, index) => ({
        id: item.id,
        sort: index + 1
      }))
      
      await batchUpdateSort({ items })
      ElMessage.success('排序更新成功')
      fetchCategoryTree()
    }
  } catch (error) {
    console.error('批量更新排序失败:', error)
    // 重新获取数据恢复原状态
    fetchCategoryTree()
  }
}

// 添加分类
const handleAdd = (parentId) => {
  dialogType.value = 'add'
  form.value = {
    id: null,
    name: '',
    parentId
  }
  dialogVisible.value = true
}

// 编辑分类
const handleEdit = (row) => {
  dialogType.value = 'edit'
  form.value = {
    id: row.id,
    name: row.name,
    parentId: row.parentId
  }
  dialogVisible.value = true
}

// 删除分类
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除分类"${row.name}"吗？删除后不可恢复！`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async() => {
    try {
      await deleteCategory(row.id)
      ElMessage.success('删除成功')
      fetchCategoryTree()
    } catch (error) {
      console.error('删除分类失败:', error)
    }
  })
}

// 提交表单
const handleSubmit = async() => {
  if (!formRef.value) return
  
  await formRef.value.validate(async(valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (dialogType.value === 'add') {
          await createCategory({
            name: form.value.name,
            parentId: form.value.parentId
          })
          ElMessage.success('添加成功')
        } else {
          await updateCategory(form.value.id, {
            name: form.value.name
          })
          ElMessage.success('更新成功')
        }
        dialogVisible.value = false
        fetchCategoryTree()
      } catch (error) {
        console.error('保存分类失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

onMounted(() => {
  fetchCategoryTree()
})
</script>

<style lang="scss" scoped>
.category-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #ebeef5;
    
    h2 {
      margin: 0;
      font-size: 20px;
      color: #303133;
    }
  }
  
  .content {
    flex: 1;
    overflow: auto;
    width: 800px;
    margin: 0 auto;
  }
}

.category-tree {
  .category-item {
    margin-bottom: 8px;
  }
  
  .child-wrapper {
    width: 100%;
  }
  
  .category-row {
    border-radius: 6px;
    margin-bottom: 2px;
    transition: all 0.3s;
    background: #fff;
    
    &:hover {
      .drag-handle {
        opacity: 1;
      }
    }
    
    &.level-1 {
      background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
    }
    
    &.level-2 {
      margin-left: 24px;
      background: #fafbfc;
    }
    
    &.level-3 {
      margin-left: 48px;
      background: #fdfdfd;
    }
    
    &.is-dragging {
      .drag-handle {
        opacity: 1;
        color: #409eff;
      }
    }
  }
  
  .category-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    
    .left-section {
      display: flex;
      align-items: center;
      flex: 1;
      
      .expand-icon {
        width: 16px;
        height: 16px;
        margin-right: 8px;
        cursor: pointer;
        transition: transform 0.3s;
        color: #909399;
        
        &:hover {
          color: #409eff;
        }
        
        &.is-expanded {
          transform: rotate(90deg);
        }
      }
      
      .expand-placeholder {
        width: 16px;
        height: 16px;
        margin-right: 8px;
      }
      
      .category-name {
        font-size: 14px;
        color: #303133;
        font-weight: 500;
      }
    }
    
    .right-section {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .category-actions {
        display: flex;
        gap: 8px;
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      .drag-handle {
        width: 16px;
        height: 16px;
        cursor: move;
        color: #909399;
        opacity: 0;
        transition: all 0.3s;
        
        &:hover {
          color: #409eff;
          transform: scale(1.1);
        }
      }
    }
    
    &:hover {
      .category-actions, .drag-handle {
        opacity: 1;
      }
    }
  }
  
  .children-container {
    margin-top: 4px;
    
    &.level-3 {
      margin-left: 24px;
    }
  }
}

.dialog-footer {
  text-align: right;
}

// 拖拽相关样式
.sortable-ghost {
  opacity: 0.3;
  background: #409eff;
  border: 2px dashed #409eff !important;
  
  .category-content {
    visibility: hidden;
  }
}

.sortable-chosen {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3) !important;
  border-color: #409eff !important;
}
</style> 
