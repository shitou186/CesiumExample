<template>
  <Dialog title="天空盒背景">
    <el-collapse v-model="activeName">
      <!-- 设置 -->
      <div class="view-list">
        <div>
          <el-button type="primary" @click="handle('none')">无</el-button>
          <el-button type="primary" @click="handle('image')">背景</el-button>
        </div>
        <div>
          <el-button type="primary" @click="handle('color')">颜色</el-button>
          <el-button type="primary" @click="handle('box')">天空盒</el-button>
        </div>
      </div>
    </el-collapse>
  </Dialog>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from "vue";
import Dialog from "@/components/dialog/index.vue";

function handle(val) {
  window.mapWork.setScene(val);
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
