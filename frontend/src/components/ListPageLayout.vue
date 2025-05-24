<template>
  <div class="list-page-container">
    <!-- 筛选区域 -->
    <el-card class="filter-card" v-if="$slots.filter">
      <slot name="filter"></slot>
    </el-card>

    <!-- 数据展示区域 -->
    <el-card class="table-card">
      <slot name="content"></slot>
    </el-card>
  </div>
</template>

<script setup>
// 无需额外的逻辑，纯布局组件
</script>

<style scoped>
.list-page-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

/* 筛选表单样式 */
:deep(.filter-form) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* 分页样式 */
:deep(.pagination) {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 