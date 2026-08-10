<template>
  <Dialog title="场景出图">
    <el-collapse v-model="activeName">
      <!-- 设置 -->
      <div class="view-list">
        <el-button type="primary" @click="handle(1)">切换二维</el-button>
        <el-button type="primary" @click="handle(2)">切换三维</el-button>
        <el-button type="primary" @click="handle(3)">切换2.5D</el-button>
      </div>
    </el-collapse>
  </Dialog>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from "vue";
import Dialog from "@/components/dialog/index.vue";

function handle(v) {
  window.mapWork.change(v);
}
</script>

<style lang="scss">
.view-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  .el-button {
    width: 150px !important;
    margin: 10px;
  }
}
.el-collapse-item__title {
  font-size: 14px;
  font-weight: bold;
}
</style>
