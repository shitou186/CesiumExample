<template>
  <CodeEditor></CodeEditor>
</template>

<script setup lang="ts">
import CodeEditor from "@/components/code-editor/index.vue";
</script>
<style lang="scss">
#root {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  #container-monaco-edit {
    width: 100%;
    height: 100%;
  }
}
</style>
