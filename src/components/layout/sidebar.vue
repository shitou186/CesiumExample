<template>
  <div class="contain-sidebar">
    <el-menu :default-active="activeIndex" :unique-opened="true">
      <div class="sidebar-bg bgstyle-vue"></div>
      <el-sub-menu v-for="(item, i) in catalog" :index="(i + 1).toString()">
        <template #title>
          <svg-icon
            :name="item.icon"
            size="16"
            style="margin-right: 5px"
          ></svg-icon>
          {{ item.name + getCount(item) }}
        </template>
        <el-menu-item
          v-for="(cItem, ci) in item.children"
          :index="i + `-` + (ci + 1).toString()"
          @click="emits('scrollTo', i.toString() + `-` + ci.toString())"
        >
          {{ cItem.name + getCount(cItem) }}
        </el-menu-item>
      </el-sub-menu>
    </el-menu>
  </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import catalog from "@/config/example.json";
import svgIcon from "@/components/svg-icon.vue";
import { getCount } from "@/utils/util";

const emits = defineEmits(["scrollTo"]);
const activeIndex = ref("1");
</script>
<style scoped lang="scss">
.contain-sidebar {
  width: 263px;
  height: calc(100vh - 120px);
  overflow-y: auto;
  overflow-x: hidden;
  background: linear-gradient(180deg, #f8fdfb, #f2f6fa);
  border-radius: 6px 6px 0 0;
  position: relative;
  display: inline-block;
  :deep(.el-menu) {
    background-color: transparent !important;
    border: none;
  }
  :deep(.el-sub-menu__title) {
    color: #000000;
    font-size: 16px;
    font-weight: 500;
  }
}
.sidebar-bg {
  width: 100%;
  height: 214px;
  position: absolute;
  left: 6px;
  background: url("@/assets/images/sidebar-bg.png") no-repeat left top;
}
</style>
