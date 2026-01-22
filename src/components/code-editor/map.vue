<template>
  <iframe
    ref="previewFrame"
    frameborder="0"
    class="preview-frame"
    allow="payment"
    @load="onLoad"
  >
  </iframe>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from "vue";
const previewFrame = ref(null);
const emits = defineEmits(["onLoad"]);

const mapJsModules = import.meta.glob("@/example/**/*.js", { eager: false });
const mapVueModules = import.meta.glob("@/example/**/*.vue", { eager: false });

const props = defineProps({
  code: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
});

async function getTemp() {
  const html = await fetch(`/temp/template.html`);
  return html.text();
}

// 更新预览内容
async function updatePreview() {
  const iframe = previewFrame.value;

  if (!iframe) return;
  // 默认示例代码
  let defaultCode = await getTemp();

  // 注入 <base> 以便相对路径的 CSS/JS 能被正确解析
  // try {
  //   const origin = window.location.origin;
  //   if (!/\<base\s+href=/i.test(defaultCode)) {
  //     defaultCode = defaultCode.replace(
  //       /<head([^>]*)>/i,
  //       `<head$1><base href="${origin}">`
  //     );
  //   }
  // } catch (e) {
  //   // ignore
  // }

  const cleanCode = props.code.replace(/export\s+(let|var|const|function)/g, "$1");
  // 优先使用 srcdoc（与父页面同源，能正确加载相对资源），不支持时回退到 document.write 或 Blob
  if ("srcdoc" in iframe) {
    iframe.srcdoc = `${window.location.origin}/editor-vue.html?id=${props.url}`;
  }
  if (iframe.contentDocument) {
    const scripted = `<script type="text/javascript">
      ${cleanCode}
    <\/script>`;
    const resultCode = defaultCode.replace("<!-- script-output -->", scripted);
    iframe.contentDocument.open();
    iframe.contentDocument.write(resultCode);
    iframe.contentDocument.close();
  }
}

function onLoad() {
  emits("onLoad");
  if (previewFrame.value && previewFrame.value.contentWindow) {
    registerExportsToWindow(props.code, {
      // 在这里注入需要的全局依赖，例如 Cesium
      Cesium: previewFrame.value.contentWindow.Cesium,
    });
    // 存在 生命周期 则调用 beforeMounted onMounted
    if (window.mapWork && window.mapWork.beforeMounted)
      window.mapWork.beforeMounted();
    if (window.mapWork && window.mapWork.onMounted) window.mapWork.onMounted();
  }
}

watch(
  () => props.code,
  () => {
    if (props.code) updatePreview();
  }
);

/**
 * 将包含 export 语句的 JS 字符串代码动态执行，并将所有导出项挂载到 window
 * @param {string} codeStr - 包含 export 的 JavaScript 字符串
 * @param {Object} [globals={}] - 需要注入的全局依赖，如 { Cesium }
 */
function registerExportsToWindow(codeStr, globals = {}) {
  // 1. 提取所有导出的标识符名称（支持 export let/var/const/function）
  const exportedNames = new Set();

  // 匹配 export function name
  const funcRegex = /export\s+function\s+(\w+)/g;
  let match;
  while ((match = funcRegex.exec(codeStr)) !== null) {
    exportedNames.add(match[1]);
  }

  // 匹配 export let/var/const name
  const varRegex = /export\s+(?:let|var|const)\s+(\w+)/g;
  while ((match = varRegex.exec(codeStr)) !== null) {
    exportedNames.add(match[1]);
  }

  if (exportedNames.size === 0) {
    console.warn("未检测到任何 export 语句");
    return;
  }

  // 2. 移除所有 export 关键字
  let cleanCode = codeStr.replace(/export\s+(let|var|const|function)/g, "$1");

  // 3. 构建参数列表和传入值（用于 new Function）
  const globalKeys = Object.keys(globals);
  const globalValues = globalKeys.map((key) => globals[key]);

  // 4. 构造注册语句：将每个导出名赋值给 window
  const registerLines = Array.from(exportedNames)
    .map((name) => `window.mapWork.${name} = ${name};`)
    .join("\n");

  // 5. 合并代码
  const finalCode = `
    ${cleanCode}
    window.mapWork = {};
    ${registerLines}
  `;

  // 6. 使用 new Function 执行（避免 eval 的作用域污染）
  try {
    const runner = new Function(...globalKeys, finalCode);
    runner(...globalValues);
    console.log(
      `✅ 成功挂载 ${exportedNames.size} 个导出项到 window:`,
      Array.from(exportedNames)
    );
  } catch (error) {
    console.error("❌ 执行动态代码失败:", error);
    throw error;
  }
}

defineExpose({ updatePreview });
</script>
