<template>
  <Dialog title="天空盒背景">
    <el-collapse v-model="activeName">
      <!-- 设置 -->
      <div class="view-list">
        <span class="demonstration">融合值</span>
        <el-slider v-model="value" :min="0" :max="2" :step="0.1" />
      </div>
    </el-collapse>
  </Dialog>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from "vue";
import Dialog from "@/components/dialog/index.vue";
const value = ref(0);
function handle(val) {
  window.mapWork.setScene(val);
}
</script>

<style lang="scss">
.view-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  .el-button {
    width: 150px !important;
    margin: 10px;
  }
  .el-slider {
    width: 200px;
    margin-left: 20px;
  }
}
.el-collapse-item__title {
  font-size: 14px;
  font-weight: bold;
}
</style>
