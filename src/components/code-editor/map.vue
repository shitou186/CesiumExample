<template>
  <iframe
    ref="previewFrame"
    frameborder="0"
    class="preview-frame"
    allow="payment"
  >
  </iframe>
</template>

<script setup>
import { map } from "lodash-es";
import { nextTick, onMounted, ref } from "vue";
const previewFrame = ref(null);

const mapJsModules = import.meta.glob("@/example/**/*.js", { eager: false });
const mapVueModules = import.meta.glob("@/example/**/*.vue", { eager: false });

const props = defineProps({
  code: {
    type: String,
    required: true,
    default: () => `Hello, Monaco Editor Vue3 + Cesium !`,
  },
});

async function getTemp() {
  const html = await fetch(`/temp/template.html`);
  return html.text();
}

async function updatePreview() {
  const iframe = previewFrame.value;

  if (!iframe) return;
  // 默认示例代码
  let defaultCode = await getTemp();

  // 注入 <base> 以便相对路径的 CSS/JS 能被正确解析
  try {
    const origin = window.location.origin;
    if (!/\<base\s+href=/i.test(defaultCode)) {
      defaultCode = defaultCode.replace(
        /<head([^>]*)>/i,
        `<head$1><base href="${origin}">`
      );
    }
  } catch (e) {
    // ignore
  }

  // 优先使用 srcdoc（与父页面同源，能正确加载相对资源），不支持时回退到 document.write 或 Blob
  if ("srcdoc" in iframe) {
    iframe.srcdoc = `http://localhost:5173/editor-vue.html?key=undefined&id=map/create/options`;
  }
  if (iframe.contentDocument) {
    const scripted = `<script type="text/javascript">${props.code}<\/script>`;
    const resultCode = defaultCode.replace("<!-- script-output -->", scripted);
    iframe.contentDocument.open();
    iframe.contentDocument.write(resultCode);
    iframe.contentDocument.close();
  }
}

onMounted(() => {
  nextTick(() => {
    updatePreview();
  });
});

defineExpose({ updatePreview });
</script>
