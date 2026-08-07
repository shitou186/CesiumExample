<template>
  <iframe
    v-if="frameKey > 0"
    :key="frameKey"
    ref="previewFrame"
    :src="runnerUrl"
    title="Cesium 示例预览"
    class="preview-frame"
    @load="onRunnerLoad"
  />
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from "vue";

const previewFrame = ref(null);
const frameKey = ref(0);
const runnerUrl = computed(() => `${import.meta.env.BASE_URL}runner.html`);
const emits = defineEmits(["run-start", "run-success", "run-error"]);

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
  resources: {
    type: Array,
    default: () => [],
  },
});

let runSequence = 0;
let pendingRun;

function createMapWorkProxy(runner, exportNames) {
  return Object.fromEntries(
    exportNames.map((name) => [name, (...args) => runner.invoke(name, args)]),
  );
}

async function run(code) {
  const runId = ++runSequence;
  emits("run-start", runId);

  if (pendingRun) {
    pendingRun.reject(new Error("A newer run replaced the pending run."));
    pendingRun = undefined;
  }

  const currentRunner = previewFrame.value?.contentWindow?.__CESIUM_RUNNER__;
  try {
    await currentRunner?.dispose?.();
  } catch (error) {
    console.warn("Failed to dispose the previous Cesium example.", error);
  }

  window.mapWork = {};

  const resultPromise = new Promise((resolve, reject) => {
    pendingRun = { runId, code, resolve, reject };
  });
  frameKey.value = runId;
  return resultPromise;
}

async function onRunnerLoad() {
  const task = pendingRun;
  if (!task || task.runId !== frameKey.value) return;

  const runner = previewFrame.value?.contentWindow?.__CESIUM_RUNNER__;
  if (!runner) {
    const error = new Error("Cesium runner failed to initialize.");
    pendingRun = undefined;
    task.reject(error);
    emits("run-error", error);
    return;
  }

  try {
    const result = await runner.run(task.code, props.url, props.resources);
    if (task.runId !== runSequence) return;

    window.mapWork = createMapWorkProxy(runner, result.exports);
    pendingRun = undefined;
    task.resolve(result);
    emits("run-success", result);
  } catch (error) {
    pendingRun = undefined;
    task.reject(error);
    emits("run-error", error);
  }
}

async function stop() {
  runSequence += 1;
  if (pendingRun) {
    pendingRun.reject(new Error("The pending run was stopped."));
    pendingRun = undefined;
  }

  await previewFrame.value?.contentWindow?.__CESIUM_RUNNER__?.dispose?.();
  window.mapWork = {};
  frameKey.value = 0;
}

onBeforeUnmount(() => {
  void stop();
});

defineExpose({ run, updatePreview: run, stop });
</script>
