<template>
  <Dialog title="默认视角">
    <el-collapse v-model="activeName">
      <el-collapse-item title="相机和视角控制演示" name="1">
        <!-- 设置 -->
        <div class="view-list">
          <div>
            <el-button type="primary" @click="handleChange('default')"
              >飞行至默认视角</el-button
            >
            <el-button type="primary" @click="getCamera"
              >获取当前地图视角</el-button
            >
          </div>
          <div>
            <el-button type="primary" @click="handleChange('flyTo')"
              >定位至指定视角</el-button
            >
            <el-button type="primary" @click="handleChange('point')"
              >定位至目标点</el-button
            >
          </div>
        </div>

        <el-form-item label="经度值：">
          <el-input v-model="obj.lng" type="number"></el-input>
        </el-form-item>
        <el-form-item label="纬度值：">
          <el-input v-model="obj.lat" type="number"></el-input>
        </el-form-item>
        <el-form-item label="高度值：">
          <el-input v-model="obj.alt" type="number"></el-input>
        </el-form-item>
        <el-form-item label="方向角：">
          <el-input v-model="obj.heading" type="number"></el-input>
        </el-form-item>
        <el-form-item label="俯仰角：">
          <el-input v-model="obj.pitch" type="number"></el-input>
        </el-form-item>
        <el-form-item label="翻滚角：">
          <el-input v-model="obj.roll" type="number"></el-input>
        </el-form-item>
      </el-collapse-item>
    </el-collapse>
  </Dialog>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import Dialog from "@/components/dialog/index.vue";
import { createListenerRegistration } from "./listener-registration.mjs";

const activeName = ref("1");
const obj = reactive({
  lng: 0,
  lat: 0,
  alt: 0,
  heading: 0,
  pitch: 0,
  roll: 0,
});

function handleChange(type) {
  window.mapWork.flyTo(type);
}

function getCamera() {
  const data = window.mapWork.getCameraView();
  obj.lng = data.lng;
  obj.lat = data.lat;
  obj.alt = data.alt;
  obj.heading = data.heading;
  obj.pitch = data.pitch;
  obj.roll = data.roll;
  console.log(obj);
}

const cameraListener = createListenerRegistration(() =>
  window.mapWork.openListener(),
);

onMounted(() => {
  void cameraListener.open();
});

onBeforeUnmount(() => {
  cameraListener.close();
});
</script>

<style lang="scss">
.view-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  .el-button {
    width: 150px !important;
    margin-bottom: 10px;
  }
}
.el-collapse-item__title {
  font-size: 14px;
  font-weight: bold;
}
</style>
