<template>
  <Dialog style="width: 500px" title="坐标拾取">
    <!-- 主坐标类型切换 -->
    <el-radio-group v-model="radio" @change="handleRadioChange">
      <el-radio value="1">十进制</el-radio>
      <el-radio value="2">度分秒</el-radio>
      <el-radio value="3">平面坐标</el-radio>
    </el-radio-group>

    <!-- 分带选择 -->
    <el-form-item v-if="radio === '3'" label="分带" style="margin-top: 10px;">
      <el-radio-group v-model="zoneType">
        <el-radio value="1">三度带</el-radio>
        <el-radio value="2">六度带</el-radio>
      </el-radio-group>
    </el-form-item>

    <!-- 1 & 2: 经纬度模式 -->
    <div v-if="radio === '1' || radio === '2'" style="margin-top: 15px;">
      <el-form-item label="经度">
        <el-input v-model="obj.lng" placeholder="在地图上点击拾取经度" />
      </el-form-item>
      <el-form-item label="纬度">
        <el-input v-model="obj.lat" placeholder="在地图上点击拾取纬度" />
      </el-form-item>
      <el-form-item label="高程">
        <el-input v-model="obj.alt" placeholder="高程 (m)" />
      </el-form-item>
    </div>

    <!-- 3: 平面坐标模式 -->
    <div v-else style="margin-top: 15px;">
      <el-form-item label="横坐标">
        <el-input v-model="obj.lng" placeholder="在地图上点击拾取 X 坐标" />
      </el-form-item>
      <el-form-item label="纵坐标">
        <el-input v-model="obj.lat" placeholder="在地图上点击拾取 Y 坐标" />
      </el-form-item>
      <el-form-item label="高度值">
        <el-input v-model="obj.alt" placeholder="高度 (m)" />
      </el-form-item>
    </div>

    <div class="view-list">
      <el-button type="info" plain @click="handleClear">清空坐标与标注</el-button>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import Dialog from "@/components/dialog/index.vue";

const radio = ref("1");
const zoneType = ref("1");

const obj = ref({
  lng: "",
  lat: "",
  alt: "",
});

// 组件加载时注册地图点击事件的回调[cite: 1, 2]
onMounted(() => {
  if (window.mapWork && window.mapWork.onPointPicked) {
    window.mapWork.onPointPicked(() => {
      // 当地图点击完成后，自动把最新点位更新至当前选中的格式输入框[cite: 1, 2]
      window.mapWork.selectType(radio.value, obj.value);
    });
  }
});

// 组件卸载时解绑回调[cite: 2]
onUnmounted(() => {
  if (window.mapWork && window.mapWork.offPointPicked) {
    window.mapWork.offPointPicked();
  }
});

// 切换单选类型时，若已有拾取点，则自动刷新输入框格式[cite: 1, 2]
function handleRadioChange(val) {
  if (window.mapWork && window.mapWork.getSelectPoint()) {
    window.mapWork.selectType(val, obj.value);
  }
}

// 清空按钮逻辑[cite: 1]
function handleClear() {
  obj.value = { lng: "", lat: "", alt: "" };
  if (window.mapWork && window.mapWork.clearMarker) {
    window.mapWork.clearMarker();
  }
}
</script>

<style lang="scss">
.view-list {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
}
.el-collapse-item__title {
  font-size: 14px;
  font-weight: bold;
}
</style>