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

    <!-- 匿名插槽：用于放置弹窗等不需要嵌套在卡片内的内容 -->
    <slot></slot>
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