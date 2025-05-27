<template>
  <div class="list-page-container">
    <!-- 筛选区域 -->
    <el-card class="filter-card" v-if="$slots.filter">
      <slot name="filter"></slot>
    </el-card>

    <!-- 数据展示区域 -->
    <el-card class="table-card">
      <div class="table-content">
        <slot name="content"></slot>
      </div>
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
  height: calc(100vh - 100px); /* 减去顶部导航栏高度 */
  display: flex;
  flex-direction: column;
}

.filter-card {
  margin-bottom: 20px;
  flex-shrink: 0; /* 不允许压缩 */
}

.table-card {
  flex: 1; /* 占用剩余空间 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止内容溢出 */
}

.table-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
}

.table-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-content :deep(.el-table) {
  flex: 1;
}

.table-content :deep(.el-table .el-table__body-wrapper) {
  overflow-y: auto; /* 表格内容超出时显示纵向滚动条 */
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
  flex-shrink: 0; /* 分页不允许压缩 */
}
</style> 