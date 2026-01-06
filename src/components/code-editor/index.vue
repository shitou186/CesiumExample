<template>
  <div class="editor-vueApp">
    <div
      id="split-left"
      class="editors"
      :style="{ width: `calc(${leftWidth}% - 2.5px)` }"
    >
      <div class="left-header">
        <el-link underline="never" type="primary" @click="reset">
          <el-icon><Refresh /></el-icon>重置
        </el-link>
        <el-link underline="never" type="primary" @click="run">
          <el-icon><VideoPlay /></el-icon>运行
        </el-link>
      </div>
      <CodeEditor
        ref="codeEditorRef"
        style="height: calc(100% - 40px)"
        v-model:value="code"
        language="javascript"
        theme="vs-dark"
        :options="editorOptions"
      />
    </div>
    <div id="splitter" class="splitter-bar"></div>
    <div
      id="split-right"
      class="preview"
      :style="{ width: `calc(${rightWidth}% - 2.5px)` }"
    >
      <Map ref="mapRef" :code="code"></Map>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from "vue";
import { CodeEditor } from "monaco-editor-vue3";
import Map from "./map.vue";
import { Refresh, VideoPlay } from "@element-plus/icons-vue";

const code = ref();
const codeEditorRef = ref(null);
const mapRef = ref(null);
const url = ref(window.location.search.split("id=")[1] || "");

/**
 * 重置代码
 */
async function reset() {
  code.value = await getMapJs();
}

/**
 * 运行代码
 */
function run() {
  const newCode = codeEditorRef.value?.value || "";
  mapRef.value?.updatePreview(newCode);
}

onMounted(async () => {
  code.value = await getMapJs();
  initDragBar();
});

const mapModules = import.meta.glob("@/example/**/*/map.js", { as: "raw" });

async function getMapJs() {
  const path = `/src/example/${url.value}/map.js`;
  const loadModule = mapModules[path];
   if (!loadModule) throw new Error(`Map not found: ${url.value}`);
  return await loadModule();
}

const editorOptions = {
  fontSize: 14,
  minimap: { enabled: true },
  automaticLayout: true,
};

const leftWidth = ref((550 / window.innerWidth) * 100);
const rightWidth = ref(100 - leftWidth.value);
function initDragBar() {
  const resizer = document.getElementById("splitter");
  const left = document.getElementById("split-left");
  const right = document.getElementById("split-right");
  let isResizing = false;

  // 鼠标按下开始拖动
  resizer.addEventListener("mousedown", (e) => {
    isResizing = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none"; // 防止文字被选中
    right.style.pointerEvents = "none";
  });

  // 鼠标移动时调整宽度
  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    const containerRect = resizer.parentElement.getBoundingClientRect();
    const newLeftWidth = e.clientX - containerRect.left;
    // 设置最小宽度防止完全折叠
    if (newLeftWidth > 400 && newLeftWidth < containerRect.width - 400) {
      leftWidth.value = (newLeftWidth / containerRect.width) * 100;
      rightWidth.value = 100 - leftWidth.value;
      console.log(`Left: ${leftWidth.value}%, Right: ${rightWidth.value}%`);
    }
  });

  // 鼠标松开结束拖动
  document.addEventListener("mouseup", () => {
    isResizing = false;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
    right.style.pointerEvents = "all";
  });
}
</script>

<style lang="scss">
.editor-vueApp {
  display: flex;
  width: 100%;
  height: 100vh;

  .editors {
    width: 550px;
    height: 100%;
    .left-header {
      height: 40px;
      line-height: 40px;
      padding: 0 10px;
      white-space: nowrap;
      min-width: 300px;
      background-color: #23272f;
      color: #fff;
      display: flex;
      justify-content: flex-end;
      a {
        margin-right: 10px;
      }
    }
  }
  .preview {
    width: calc(100% - 550px);
    height: 100%;
    display: flex;
    flex-direction: row;
    overflow: hidden;
  }
}

.splitter-bar {
  display: block;
  width: 5px;
  background-color: #1c222b;
  background-repeat: no-repeat;
  background-position: 50%;
  z-index: 1000;
  border-right: 1px solid #000;
  background-image: url("@/assets/images/gutter.png");
  cursor: col-resize;
}

.preview-frame {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  html,
  body {
    width: 100%;
    height: 100%;
  }
}
</style>
