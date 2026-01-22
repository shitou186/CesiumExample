<template>
  <el-dialog
    v-model="props.visible"
    :modal="false"
    modal-penetrable
    v-bind="props"
    class="dialog-custom"
    :style="style"
  >
    <slot></slot>
    <template #footer>
      <div class="drawer-footer"></div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps({
  visible: { type: Boolean, default: true },
  title: { type: String, default: undefined },
  top: { type: String, default: "20px" },
  width: { type: String, default: "25%" },
  "show-close": { type: Boolean, default: false },
  draggable: { type: Boolean, default: true },
  direction: { type: String, default: "left" },
});
const style = computed(() => {
  return props.direction === "left"
    ? { marginLeft: "20px" }
    : { marginRight: "20px" };
});
</script>
<style lang="scss">
#split-right {
  .el-modal-dialog {
    position: absolute !important;
    .el-overlay-dialog {
      position: absolute !important;
      .dialog-custom {
        max-height: calc(100vh - 100px);
        overflow: auto;
      }
    }
  }
}
</style>
