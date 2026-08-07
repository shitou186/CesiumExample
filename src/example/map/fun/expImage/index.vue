<template>
  <Dialog title="场景出图">
    <el-collapse v-model="activeName">
      <!-- 设置 -->
      <div class="view-list">
        <div>
          <el-button type="primary" @click="handle">导出场景图</el-button>
        </div>
      </div>
    </el-collapse>
  </Dialog>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from "vue";
import Dialog from "@/components/dialog/index.vue";

const activeName = ref("1");
const obj = reactive({
  lng: 0,
  lat: 0,
  alt: 0,
  heading: 0,
  pitch: 0,
  roll: 0,
});

function handle() {
  window.mapWork.exportImage();
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
