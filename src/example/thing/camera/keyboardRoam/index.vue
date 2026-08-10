<template>
  <Dialog style="width: 500px" :visible="true" title="键盘漫游">
    <div class="keyboard-img"></div>
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
.keyboard-img {
    width: 447px;
    height: 180px;
    background-image: url("@/assets/images/keyboard.png");
}
.el-collapse-item__title {
  font-size: 14px;
  font-weight: bold;
}
</style>
