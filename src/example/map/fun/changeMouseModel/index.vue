<template>
  <Dialog>
    <el-radio-group v-model="radio" @change="handle">
      <el-radio :value="1"
        >左键平移+中键旋转+右键缩放（Cesium操作习惯）</el-radio
      >
      <el-radio :value="2">左键平移+中键缩放+右键旋转（中右键互换）</el-radio>
      <el-radio :value="3"
        >左键旋转+中键平移+右键缩放（自定义设置演示）</el-radio
      >
    </el-radio-group>
  </Dialog>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from "vue";
import Dialog from "@/components/dialog/index.vue";

const radio = ref(1);
function handle() {
  window.mapWork.setMouseControlMode(radio.value);
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
