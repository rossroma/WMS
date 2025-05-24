<template>
  <div class="image-upload">
    <el-upload
      ref="uploadRef"
      class="image-uploader"
      :auto-upload="false"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :on-change="handleFileChange"
      :disabled="uploading || disabled"
      accept="image/*"
    >
      <div class="upload-content">
        <img v-if="imageUrl && !uploading" :src="getSquareThumbnail(imageUrl)" class="uploaded-image" />
        <div v-else-if="uploading" class="uploading">
          <el-icon class="uploading-icon"><Loading /></el-icon>
          <div class="uploading-text">上传中...</div>
        </div>
        <div v-else class="upload-placeholder">
          <el-icon class="upload-icon"><Plus /></el-icon>
          <div class="upload-text">点击上传图片</div>
          <div class="upload-tip">支持 JPG、PNG、GIF 格式，大小不超过 5MB</div>
        </div>
      </div>
    </el-upload>
    
    <!-- 图片预览和操作 -->
    <div v-if="imageUrl && !uploading" class="image-actions">
      <el-button size="small" @click="previewImage">预览</el-button>
      <el-button size="small" type="danger" @click="removeImage">删除</el-button>
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible">
      <img w-full :src="getPreviewThumbnail(imageUrl)" alt="预览图片" style="width: 100%; height: auto;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Loading } from '@element-plus/icons-vue'
import { uploadFile } from '@/api/upload'
import { getSquareThumbnail, getPreviewThumbnail } from '@/utils/image'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  width: {
    type: String,
    default: '178px'
  },
  height: {
    type: String,
    default: '178px'
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change'])

// 响应式数据
const uploadRef = ref(null)
const uploading = ref(false)
const previewVisible = ref(false)

// 计算属性
const imageUrl = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    emit('change', value)
  }
})

// 上传前验证
const beforeUpload = (rawFile) => {
  // 检查文件类型（与后端配置保持一致）
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(rawFile.type)) {
    ElMessage.error('图片格式不正确！请上传 JPG、PNG、GIF 格式的图片')
    return false
  }

  // 检查文件大小（5MB）
  const maxSize = 5 * 1024 * 1024
  if (rawFile.size > maxSize) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }

  return true
}

// 文件选择变化处理
const handleFileChange = async (file) => {
  if (!beforeUpload(file.raw)) {
    return
  }

  uploading.value = true
  
  try {
    const response = await uploadFile(file.raw)
    
    if (response && response.status === 'success' && response.data && response.data.url) {
      imageUrl.value = response.data.url
      ElMessage.success('图片上传成功')
    } else {
      console.error('上传响应格式错误:', response)
      ElMessage.error('图片上传失败：响应格式错误')
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    
    // 根据错误类型给出不同提示
    let errorMessage = '图片上传失败，请重试'
    if (error.response) {
      const { status, data } = error.response
      if (status === 413) {
        errorMessage = '图片文件过大，请选择较小的图片'
      } else if (status === 415) {
        errorMessage = '不支持的图片格式'
      } else if (data && data.message) {
        errorMessage = data.message
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = '上传超时，请检查网络连接'
    }
    
    ElMessage.error(errorMessage)
  } finally {
    uploading.value = false
    // 清除文件选择，允许重新选择同一文件
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }
  }
}

// 预览图片
const previewImage = () => {
  previewVisible.value = true
}

// 删除图片
const removeImage = () => {
  imageUrl.value = ''
  ElMessage.success('图片已删除')
}
</script>

<style lang="scss" scoped>
.image-upload {
  .image-uploader {
    :deep(.el-upload) {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.2s;
      width: v-bind(width);
      height: v-bind(height);

      &:hover {
        border-color: #409eff;
      }
    }

    :deep(.el-upload.is-disabled) {
      cursor: not-allowed;
      opacity: 0.6;

      &:hover {
        border-color: #d9d9d9;
      }
    }
  }

  .upload-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .uploaded-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .uploading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #999;

    .uploading-icon {
      font-size: 28px;
      animation: rotating 2s linear infinite;
      margin-bottom: 8px;
    }

    .uploading-text {
      font-size: 14px;
    }
  }

  .upload-placeholder {
    text-align: center;
    color: #999;

    .upload-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }

    .upload-text {
      font-size: 14px;
      margin-bottom: 4px;
    }

    .upload-tip {
      font-size: 12px;
      color: #ccc;
      line-height: 1.2;
    }
  }

  .image-actions {
    margin-top: 8px;
    text-align: center;

    .el-button + .el-button {
      margin-left: 8px;
    }
  }
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style> 