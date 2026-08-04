# Scene Center Runner Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the scene-center panel call `openListener()` only after the iframe runner is ready, and remove the example's independent runtime errors.

**Architecture:** Keep iframe readiness ownership in the code editor: await the existing `Map.run()` promise before mounting the control panel. Keep Cesium listener ownership in the scene-center panel through a small async registration helper that safely disposes a listener even if unmount races registration.

**Tech Stack:** Vue 3 Composition API, JavaScript ES modules, CesiumJS, Node.js built-in test runner, Vite/TypeScript build.

## Global Constraints

- Do not change `src/pages/runner/main.ts`.
- Do not load terrain in the scene-center example.
- Do not introduce polling or a new iframe event bridge.
- Preserve unrelated user changes in the dirty worktree.

---

### Task 1: Mount the Control Panel After Runner Readiness

**Files:**
- Create: `src/components/code-editor/mount-after-run.mjs`
- Create: `tests/mount-after-run.test.mjs`
- Modify: `src/components/code-editor/index.vue`

**Interfaces:**
- Consumes: the existing `run(): Promise<void>` function in `src/components/code-editor/index.vue`.
- Produces: `mountAfterRun(runExample: () => Promise<unknown>, mountPanel: () => void): Promise<void>`.

- [ ] **Step 1: Write the failing readiness-order test**

```javascript
import assert from "node:assert/strict";
import test from "node:test";
import { mountAfterRun } from "../src/components/code-editor/mount-after-run.mjs";

test("mounts the panel only after the runner resolves", async () => {
  const events = [];
  let finishRun;
  const runExample = () =>
    new Promise((resolve) => {
      finishRun = () => {
        events.push("runner-ready");
        resolve();
      };
    });

  const pending = mountAfterRun(runExample, () => events.push("panel-mounted"));
  assert.deepEqual(events, []);

  finishRun();
  await pending;

  assert.deepEqual(events, ["runner-ready", "panel-mounted"]);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/mount-after-run.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `mount-after-run.mjs`.

- [ ] **Step 3: Add the minimal readiness helper**

```javascript
export async function mountAfterRun(runExample, mountPanel) {
  await runExample();
  mountPanel();
}
```

- [ ] **Step 4: Integrate the helper in the editor lifecycle**

Import `mountAfterRun` in `src/components/code-editor/index.vue`. In its `onMounted`, assign `originalCode`, `code`, and `vueCompOnlyRead`, then replace the current early `vueComp.value = panel; await run();` sequence with:

```javascript
await mountAfterRun(run, () => {
  vueComp.value = panel;
});
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `node --test tests/mount-after-run.test.mjs`

Expected: one passing test and no warnings.

- [ ] **Step 6: Commit the readiness fix**

```bash
git add src/components/code-editor/mount-after-run.mjs src/components/code-editor/index.vue tests/mount-after-run.test.mjs
git commit -m "fix: mount example panel after runner readiness"
```

### Task 2: Correct Scene-Center Map Runtime Behavior

**Files:**
- Create: `tests/scene-center-map.test.mjs`
- Modify: `src/example/map/options/scene-center/map.js`

**Interfaces:**
- Consumes: the existing `Cesium` global injected by the iframe runner.
- Produces: `getCameraView(): CameraView` and `openListener(): () => void`, where `CameraView` contains `lon`, `lat`, `alt`, `heading`, `pitch`, and `roll` numbers.

- [ ] **Step 1: Add a real-module test harness and failing terrain test**

Create `tests/scene-center-map.test.mjs` that reads the actual map module, imports it through a data URL, and supplies only the Cesium APIs used by this example:

```javascript
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { afterEach } from "node:test";

const mapPath = new URL(
  "../src/example/map/options/scene-center/map.js",
  import.meta.url,
);

async function loadMapModule() {
  const source = await readFile(mapPath, "utf8");
  return import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}#${Date.now()}-${Math.random()}`
  );
}

function installCesiumHarness() {
  const removeListener = () => {};
  let moveEndListener;
  const camera = {
    flyTo() {},
    positionCartographic: { longitude: 1, latitude: 0.5, height: 1234.567 },
    heading: 0.25,
    pitch: -0.5,
    roll: 0.125,
    moveEnd: {
      addEventListener(listener) {
        moveEndListener = listener;
        return removeListener;
      },
    },
  };
  const viewer = {
    camera,
    scene: { camera },
    destroy() {},
    isDestroyed() {
      return false;
    },
  };
  globalThis.Cesium = {
    Viewer: class {
      constructor() {
        return viewer;
      }
    },
    Cartesian3: { fromDegrees: () => ({}) },
    Math: {
      toRadians: (value) => value,
      toDegrees: (value) => (value * 180) / globalThis.Math.PI,
    },
  };
  return {
    moveEnd: () => moveEndListener(),
    removeListener,
  };
}

afterEach(() => {
  delete globalThis.Cesium;
});

test("mounts without requiring terrain", async () => {
  installCesiumHarness();
  const map = await loadMapModule();
  assert.doesNotThrow(() => map.onMounted());
});
```

- [ ] **Step 2: Run the terrain test and verify RED**

Run: `node --test tests/scene-center-map.test.mjs`

Expected: FAIL with `ReferenceError: loadTerrain is not defined`.

- [ ] **Step 3: Remove the unused terrain call**

Delete only `loadTerrain();` from `onMounted()`.

- [ ] **Step 4: Run the terrain test and verify GREEN**

Run: `node --test tests/scene-center-map.test.mjs`

Expected: one passing test.

- [ ] **Step 5: Add the failing camera-view test**

```javascript
test("reads camera coordinates from positionCartographic", async () => {
  installCesiumHarness();
  const map = await loadMapModule();
  map.onMounted();

  const view = map.getCameraView();

  assert.equal(view.lon, 57.29578);
  assert.equal(view.lat, 28.64789);
  assert.equal(view.alt, 1234.57);
});
```

- [ ] **Step 6: Run the camera-view test and verify RED**

Run: `node --test tests/scene-center-map.test.mjs`

Expected: FAIL with `ReferenceError: position is not defined`.

- [ ] **Step 7: Read from the declared cartographic value**

Replace the three `position.longitude`, `position.latitude`, and `position.height` reads with `cartographic.longitude`, `cartographic.latitude`, and `cartographic.height`.

- [ ] **Step 8: Add the failing listener-disposer test**

```javascript
test("returns Cesium's moveEnd listener disposer", async () => {
  const harness = installCesiumHarness();
  const map = await loadMapModule();
  map.onMounted();

  const removeListener = map.openListener();

  assert.equal(removeListener, harness.removeListener);
  assert.doesNotThrow(() => harness.moveEnd());
});
```

- [ ] **Step 9: Run the listener test and verify RED**

Run: `node --test tests/scene-center-map.test.mjs`

Expected: FAIL because `openListener()` returns `undefined` instead of the Cesium removal callback.

- [ ] **Step 10: Return the Cesium removal callback**

```javascript
export function openListener() {
  return viewer.scene.camera.moveEnd.addEventListener(() => getCameraView());
}
```

- [ ] **Step 11: Run all scene-center map tests and verify GREEN**

Run: `node --test tests/scene-center-map.test.mjs`

Expected: three passing tests and no warnings.

- [ ] **Step 12: Commit the map fix**

```bash
git add src/example/map/options/scene-center/map.js tests/scene-center-map.test.mjs
git commit -m "fix: correct scene center camera listener"
```

### Task 3: Make Listener Registration Safe Across Vue Unmount

**Files:**
- Create: `src/example/map/options/scene-center/listener-registration.mjs`
- Create: `tests/listener-registration.test.mjs`
- Modify: `src/example/map/options/scene-center/index.vue`

**Interfaces:**
- Consumes: `window.mapWork.openListener(): Promise<() => void>` from the iframe proxy.
- Produces: `createListenerRegistration(register)` returning `{ open(): Promise<void>, close(): void }`.

- [ ] **Step 1: Write failing async cleanup tests**

```javascript
import assert from "node:assert/strict";
import test from "node:test";
import { createListenerRegistration } from "../src/example/map/options/scene-center/listener-registration.mjs";

test("removes a registered listener when closed", async () => {
  let removed = 0;
  const registration = createListenerRegistration(async () => () => {
    removed += 1;
  });

  await registration.open();
  registration.close();

  assert.equal(removed, 1);
});

test("removes a listener that resolves after the component closes", async () => {
  let resolveRegistration;
  let removed = 0;
  const registration = createListenerRegistration(
    () =>
      new Promise((resolve) => {
        resolveRegistration = resolve;
      }),
  );

  const pending = registration.open();
  registration.close();
  resolveRegistration(() => {
    removed += 1;
  });
  await pending;

  assert.equal(removed, 1);
});
```

- [ ] **Step 2: Run the cleanup tests and verify RED**

Run: `node --test tests/listener-registration.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `listener-registration.mjs`.

- [ ] **Step 3: Implement the minimal async registration owner**

```javascript
export function createListenerRegistration(register) {
  let closed = false;
  let removeListener;

  return {
    async open() {
      const remove = await register();
      if (closed) {
        remove?.();
        return;
      }
      removeListener = remove;
    },
    close() {
      closed = true;
      removeListener?.();
      removeListener = undefined;
    },
  };
}
```

- [ ] **Step 4: Integrate registration ownership into the Vue panel**

Import `onBeforeUnmount` and `createListenerRegistration`. Replace the direct `nextTick` call with:

```javascript
const cameraListener = createListenerRegistration(() =>
  window.mapWork.openListener(),
);

onMounted(() => {
  void cameraListener.open();
});

onBeforeUnmount(() => {
  cameraListener.close();
});
```

Remove the `debugger`, the unused `dd`, and the no-longer-needed `nextTick` import.

- [ ] **Step 5: Run the focused cleanup tests and verify GREEN**

Run: `node --test tests/listener-registration.test.mjs`

Expected: two passing tests and no warnings.

- [ ] **Step 6: Commit the panel cleanup**

```bash
git add src/example/map/options/scene-center/listener-registration.mjs src/example/map/options/scene-center/index.vue tests/listener-registration.test.mjs
git commit -m "fix: dispose scene center camera listener"
```

### Task 4: Full Verification

**Files:**
- Verify only; no planned production-file changes.

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: passing regression tests and a successful production build.

- [ ] **Step 1: Run all regression tests**

Run: `node --test tests/mount-after-run.test.mjs tests/scene-center-map.test.mjs tests/listener-registration.test.mjs`

Expected: six passing tests and no failures.

- [ ] **Step 2: Run the production build**

Run: `pnpm build`

Expected: `vue-tsc -b` and Vite build both exit with code 0.

- [ ] **Step 3: Inspect the final diff**

Run: `git diff HEAD~3 -- src/components/code-editor/index.vue src/components/code-editor/mount-after-run.mjs src/example/map/options/scene-center/map.js src/example/map/options/scene-center/index.vue src/example/map/options/scene-center/listener-registration.mjs tests`

Expected: only the approved readiness, terrain removal, camera-variable correction, listener cleanup, and regression tests are present.

- [ ] **Step 4: Report the manual browser limitation if it persists**

The local browser connection previously failed because the Windows sandbox could not initialize. If still unavailable, report that automated tests and the production build passed but interactive browser verification could not be completed in this environment; do not claim it was manually verified.
