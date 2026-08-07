<template>
  <div class="editor-vueApp">
    <div
      id="split-left"
      class="editors"
      :style="{ width: `calc(${leftWidth}% - 2.5px)` }"
    >
      <div class="left-header">
        <div class="header-item">
          <div class="item-img" @click="changeVisible('js')">
            <img :src="jsPng" alt="" />
          </div>
          <div
            v-if="vueCompOnlyRead"
            class="item-img"
            @click="changeVisible('vue')"
          >
            <img :src="htmlPng" alt="" />
          </div>
        </div>
        <div>{{ text }}</div>
        <div>
          <el-link
            :disabled="isRunning"
            underline="never"
            type="primary"
            @click="reset"
          >
            <el-icon><Refresh /></el-icon>重置
          </el-link>
          <el-link
            :disabled="isRunning"
            underline="never"
            type="primary"
            @click="run"
          >
            <el-icon><VideoPlay /></el-icon>{{ isRunning ? "运行中" : "运行" }}
          </el-link>
        </div>
      </div>
      <CodeEditor
        v-show="current === 'js'"
        style="height: calc(100% - 40px)"
        v-model:value="code"
        language="javascript"
        theme="vs-dark"
        :options="editorOptions"
      />
      <CodeEditor
        v-show="current === 'vue'"
        style="height: calc(100% - 40px)"
        v-model:value="vueCompOnlyRead"
        language="html"
        theme="vs-dark"
        :options="readOnlyOption"
      />
    </div>
    <div id="splitter" class="splitter-bar"></div>
    <div
      id="split-right"
      class="preview"
      :style="{ width: `calc(${rightWidth}% - 2.5px)` }"
    >
      <component :is="vueComp" />
      <div v-if="runError" class="runner-error">
        <el-alert
          :title="runError"
          type="error"
          show-icon
          :closable="true"
          @close="runError = ''"
        />
      </div>
      <Map ref="mapRef" :url="url"></Map>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, shallowRef } from "vue";
import { CodeEditor } from "monaco-editor-vue3";
import Map from "./map.vue";
import { mountAfterRun } from "./mount-after-run.mjs";
import { Refresh, VideoPlay } from "@element-plus/icons-vue";
import jsPng from "@/assets/images/js.png";
import htmlPng from "@/assets/images/html.png";
const current = ref("js");

const code = ref("");
const originalCode = ref("");
const vueComp = shallowRef();
const vueCompOnlyRead = shallowRef();
const mapRef = ref(null);
const url = ref(new URLSearchParams(window.location.search).get("id") || "");
const text = ref("代码编辑器");
const isRunning = ref(false);
const runError = ref("");

function changeVisible(type) {
  current.value = type;
  if (type === "js") {
    text.value = "代码编辑器";
  } else if (type === "vue") {
    text.value = "UI面板代码（只读）";
  }
}

/**
 * 重置代码
 */
async function reset() {
  code.value = originalCode.value;
  await run();
}

/**
 * 运行代码
 */
async function run() {
  if (isRunning.value || !code.value) return;

  isRunning.value = true;
  runError.value = "";
  try {
    await mapRef.value?.run(code.value);
  } catch (error) {
    runError.value = error instanceof Error ? error.message : String(error);
  } finally {
    isRunning.value = false;
  }
}

onMounted(async () => {
  initDragBar();
  try {
    const [sourceCode, panel, panelSource] = await Promise.all([
      getMapJs(),
      getVueComp(),
      getOnlyReadVueComp(),
    ]);
    originalCode.value = sourceCode;
    code.value = sourceCode;
    vueCompOnlyRead.value = panelSource;
    await mountAfterRun(run, () => {
      vueComp.value = panel;
    });
  } catch (error) {
    runError.value = error instanceof Error ? error.message : String(error);
  }
});

const mapModules = import.meta.glob("@/example/**/*/map.js", {
  query: "?raw",
  import: "default",
});
const vueModules = import.meta.glob("@/example/**/*/index.vue", {
  import: "default",
});

const vueOnlyReadModules = import.meta.glob("@/example/**/*/index.vue", {
  query: "?raw",
  import: "default",
});

async function getMapJs() {
  const path = `/src/example/${url.value}/map.js`;
  const loadModule = mapModules[path];
  if (!loadModule) throw new Error(`Map not found: ${url.value}`);
  return await loadModule();
}

async function getVueComp() {
  const path = `/src/example/${url.value}/index.vue`;
  const loadModule = vueModules[path];
  return loadModule ? await loadModule() : loadModule || undefined;
}

async function getOnlyReadVueComp() {
  const path = `/src/example/${url.value}/index.vue`;
  const loadModule = vueOnlyReadModules[path];
  return loadModule ? await loadModule() : loadModule || undefined;
}

const editorOptions = {
  fontSize: 14,
  minimap: { enabled: true },
  automaticLayout: true,
};

const readOnlyOption = {
  fontSize: 14,
  minimap: { enabled: true },
  automaticLayout: true,
  readOnly: true,
};

// 分割栏拖动逻辑
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
      justify-content: space-between;
      a {
        margin-right: 10px;
      }
      .header-item {
        display: flex;
        align-items: center;
        .item-img {
          width: 24px;
          height: 24px;
          display: inline-block;
          margin-right: 5px;
          line-height: 0;
          padding: 2px;
          border-radius: 2px;
          background-color: #3ea6ff;
          cursor: pointer;
          img {
            width: 100%;
            height: 100%;
          }
        }
      }
    }
  }
  .preview {
    width: calc(100% - 550px);
    height: 100%;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    position: relative;
    .runner-error {
      position: absolute;
      top: 12px;
      right: 12px;
      width: min(520px, calc(100% - 24px));
      z-index: 3000;
    }
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
