<template>
  <div class="layout">
    <el-container>
      <el-header>
        <div class="wrap"></div>
      </el-header>
      <el-container>
        <el-aside>
          <Sidebar @scrollTo="scrollTo"></Sidebar>
        </el-aside>
        <el-main>
          <Table ref="tableRef"></Table>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import Sidebar from "./sidebar.vue";
import Table from "./table.vue";

const tableRef = ref<InstanceType<typeof Table>>();
function scrollTo(v: string) {
  tableRef.value?.scrollTo(v);
}
</script>
<style scoped lang="scss">
.wrap {
  width: 100%;
  height: 62px;
  border-bottom: 1px solid #e2e6e9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  align-content: center;
  background: url("@/assets/images/header-wrap.png") no-repeat left top;
  background-size: cover;
}
</style>
