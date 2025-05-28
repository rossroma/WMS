<template>
  <div class="address-select">
    <div class="cascader-row">
      <el-cascader
        v-model="selectedAreas"
        :options="areaData"
        :props="cascaderProps"
        placeholder="请选择省市区"
        :disabled="disabled"
        clearable
        @change="handleAreaChange"
        style="width: 100%"
      />
    </div>
    
    <div class="detail-row" v-if="showDetailInput">
      <el-input
        v-model="detailAddress"
        placeholder="请输入详细地址（街道、门牌号等）"
        :disabled="disabled"
        @input="handleDetailChange"
        style="width: 100%"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { areaData, parseAddress, getAddressString } from '@/data/areaData'

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
  showDetailInput: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change'])

// 响应式数据
const selectedAreas = ref([])
const detailAddress = ref('')

// 级联选择器配置
const cascaderProps = {
  value: 'value',
  label: 'text',
  children: 'children',
  expandTrigger: 'hover',
  emitPath: true
}

// 获取完整地址字符串
const getFullAddress = () => {
  let fullAddress = ''
  
  if (selectedAreas.value && selectedAreas.value.length === 3) {
    const [province, city, district] = selectedAreas.value
    fullAddress = getAddressString(province, city, district)
  }
  
  if (detailAddress.value) {
    fullAddress += detailAddress.value
  }
  
  return fullAddress
}

// 解析地址字符串
const parseAddressString = (addressStr) => {
  if (!addressStr) {
    selectedAreas.value = []
    detailAddress.value = ''
    return
  }
  
  const { province, city, district } = parseAddress(addressStr)
  
  if (province && city && district) {
    selectedAreas.value = [province, city, district]
    
    // 提取详细地址（去掉省市区部分）
    const areaString = getAddressString(province, city, district)
    detailAddress.value = addressStr.replace(areaString, '').trim()
  } else {
    // 如果无法解析，将整个字符串作为详细地址
    selectedAreas.value = []
    detailAddress.value = addressStr
  }
}

// 触发地址变化事件
const emitAddressChange = () => {
  const fullAddress = getFullAddress()
  emit('update:modelValue', fullAddress)
  emit('change', fullAddress)
}

// 处理省市区选择变化
const handleAreaChange = (value) => {
  if (value && value.length === 3) {
    selectedAreas.value = value
  } else {
    selectedAreas.value = []
  }
  emitAddressChange()
}

// 处理详细地址输入变化
const handleDetailChange = () => {
  emitAddressChange()
}

// 监听modelValue变化，解析地址字符串
watch(() => props.modelValue, (newVal) => {
  if (newVal && newVal !== getFullAddress()) {
    parseAddressString(newVal)
  }
}, { immediate: true })

// 组件挂载时解析初始地址
onMounted(() => {
  if (props.modelValue) {
    parseAddressString(props.modelValue)
  }
})
</script>

<style lang="scss" scoped>
.address-select {
  .cascader-row {
    margin-bottom: 12px;
  }
  
  .detail-row {
    margin-top: 0;
  }
  
  :deep(.el-cascader) {
    width: 100%;
    
    .el-input {
      width: 100%;
    }
  }
}
</style> 
