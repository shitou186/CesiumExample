<template>
  <Dialog title="天空盒背景">
    <el-form-item label="单选">
      <el-radio-group v-model="radio" @change="handle('radio')">
        <el-radio value="none">无底地形</el-radio>
        <el-radio value="standard">标准服务</el-radio>
        <el-radio value="ioc">Ioc在线服务</el-radio>
        <el-radio value="arcgis">ArcGIS服务</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="调试">
      <el-checkbox v-model="open" label="地下三角网" @change="handle" />
    </el-form-item>
  </Dialog>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from "vue";
import Dialog from "@/components/dialog/index.vue";
const radio = ref("none");
const open = ref(false);
function handle(v) {
  if (v === "radio") {
    window.mapWork.handleTerrain(radio.value);
  } else {
    window.mapWork.handleOpen(open.value);
  }
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
