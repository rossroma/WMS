<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="title"
    :width="width"
    :before-close="handleClose"
    :destroy-on-close="destroyOnClose"
    :close-on-click-modal="closeOnClickModal"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-width="labelWidth"
      class="base-form"
    >
      <slot name="form" :form="formData" :rules="rules"></slot>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer" v-if="showFooter">
        <el-button @click="handleCancel">{{ cancelText }}</el-button>
        <el-button 
          type="primary" 
          @click="handleConfirm" 
          :loading="loading"
          :disabled="loading"
        >
          {{ confirmText }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props 定义
const props = defineProps({
  // 弹窗显示状态
  modelValue: {
    type: Boolean,
    default: false
  },
  // 弹窗标题
  title: {
    type: String,
    default: '弹窗'
  },
  // 弹窗宽度
  width: {
    type: String,
    default: '600px'
  },
  // 表单数据
  formData: {
    type: Object,
    default: () => ({})
  },
  // 表单验证规则
  rules: {
    type: Object,
    default: () => ({})
  },
  // 标签宽度
  labelWidth: {
    type: String,
    default: '100px'
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 按钮文本
  cancelText: {
    type: String,
    default: '取消'
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  // 其他配置
  destroyOnClose: {
    type: Boolean,
    default: true
  },
  closeOnClickModal: {
    type: Boolean,
    default: false
  },
  // 是否在关闭时重置表单
  resetOnClose: {
    type: Boolean,
    default: true
  },
  // 是否显示底部按钮
  showFooter: {
    type: Boolean,
    default: true
  }
})

// Emits 定义
const emit = defineEmits([
  'update:modelValue',
  'confirm',
  'cancel',
  'close'
])

// 内部状态
const formRef = ref(null)

// 方法
const handleClose = () => {
  if (props.resetOnClose && formRef.value) {
    formRef.value.resetFields()
  }
  emit('close')
  emit('update:modelValue', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}

const handleConfirm = async () => {
  if (!formRef.value) return
  
  try {
    const isValid = await formRef.value.validate()
    if (isValid) {
      emit('confirm', props.formData)
    }
  } catch (error) {
    console.warn('表单验证失败:', error)
  }
}

// 暴露方法给父组件
defineExpose({
  formRef,
  validate: () => formRef.value?.validate(),
  resetFields: () => formRef.value?.resetFields(),
  clearValidate: () => formRef.value?.clearValidate()
})
</script>

<style lang="scss" scoped>
.base-form {
  padding: 20px 60px 20px 30px;

  :deep(.el-form-item) {
    margin-bottom: 24px;
    
    .el-form-item__label {
      font-weight: 500;
      color: #606266;
    }
    
    .el-input,
    .el-select,
    .el-cascader,
    .el-input-number {
      width: 100%;
    }
    
    .el-textarea {
      .el-textarea__inner {
        padding: 12px 15px;
        line-height: 1.5;
      }
    }
  }
  
  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
  
  // 必填字段样式
  :deep(.el-form-item.is-required .el-form-item__label::before) {
    content: '*';
    color: #f56c6c;
    margin-right: 4px;
  }
}

.dialog-footer {
  text-align: right;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  margin-top: 20px;
  
  .el-button + .el-button {
    margin-left: 12px;
  }
}
</style> 