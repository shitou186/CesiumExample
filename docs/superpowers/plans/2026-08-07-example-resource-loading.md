# Example Resource Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `example.json` resource declarations into visible, new-tab-openable dependencies that load in order before an example `map.js`, then use the mechanism to provide polygon-clipping to the GeoJSON mask example.

**Architecture:** The editor resolves catalog resource labels to Vite-emitted URLs and displays them in a header popover. It passes ordered `{ label, url }` descriptors through the preview component to the iframe runner, which loads classic JavaScript or CSS resources before importing the Blob-backed example module. The mask example declares the existing polygon-clipping UMD file and consumes its `globalThis.polygonClipping` API.

**Tech Stack:** Vue 3, Element Plus, Vite `import.meta.glob` asset URLs, TypeScript runner, JavaScript ES modules, Node.js built-in test runner.

## Global Constraints

- Preserve the existing `resources?: string[]` catalog schema and declaration order.
- Resolve packaged files to build-safe URLs instead of relying on runtime `/src/...` paths.
- Show a resource button only when the selected example declares resources.
- Open a selected resource URL in a new browser tab.
- Load JavaScript and CSS resources in the preview iframe before evaluating `map.js`.
- Expose polygon-clipping through its existing UMD global, `globalThis.polygonClipping`.
- Do not add a package-manager dependency or copy polygon-clipping into `public`.
- Do not edit dependency files inside the code editor or treat resource strings as ESM bindings.
- Preserve unrelated working-tree changes and stage only the files named by each task.

---

## File Structure

- Create `src/components/code-editor/example-resources.mjs`: pure recursive catalog lookup and resource-label-to-URL resolution.
- Modify `src/components/code-editor/index.vue`: resolve the active example resources, render the resource popover, and pass descriptors to the preview.
- Modify `src/components/code-editor/map.vue`: accept resource descriptors and pass them to `runner.run`.
- Create `src/pages/runner/resource-loader.mjs`: classify and sequentially inject scripts/styles into the iframe document.
- Create `src/pages/runner/resource-loader.d.mts`: declare the JavaScript loader interface for strict TypeScript.
- Modify `src/pages/runner/main.ts`: load resources before transforming/importing `map.js`.
- Modify `src/config/example.json`: declare polygon-clipping for `layer-graphic/geojson/mask`.
- Track `src/libs/polygon-clipping/polygon-clipping.umd.min.js`: include the existing dependency file required by the declaration without staging the other untracked library artifacts.
- Modify `src/example/layer-graphic/geojson/mask/map.js`: validate and expose use of the UMD global.
- Create `tests/example-resources.test.mjs`: behavioral tests for catalog lookup and URL resolution.
- Create `tests/code-editor-resources.test.mjs`: integration-contract checks for the popover and preview data flow.
- Create `tests/runner-resource-loader.test.mjs`: behavioral tests for ordered loading and failures.
- Create `tests/geojson-mask-resource.test.mjs`: catalog and map integration checks for polygon-clipping.

### Task 1: Catalog Lookup and Build-Safe URL Resolution

**Files:**
- Create: `src/components/code-editor/example-resources.mjs`
- Create: `tests/example-resources.test.mjs`

**Interfaces:**
- Consumes: catalog nodes shaped like `{ main?: string, children?: CatalogNode[], resources?: string[] }` and the two Vite glob URL tables created later.
- Produces: `findCatalogItemByMain(catalog, main)` and `resolveExampleResources({ resources, exampleMain, baseUrl, libraryResourceUrls, exampleResourceUrls })`, returning ordered `{ label, url }[]` descriptors.

- [ ] **Step 1: Write the failing resolver tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  findCatalogItemByMain,
  resolveExampleResources,
} from "../src/components/code-editor/example-resources.mjs";

test("finds a nested catalog item by main", () => {
  const mask = {
    name: "mask",
    main: "layer-graphic/geojson/mask",
    resources: ["@/libs/polygon-clipping/polygon-clipping.umd.min.js"],
  };
  assert.equal(
    findCatalogItemByMain([{ children: [{ children: [mask] }] }], mask.main),
    mask,
  );
});

test("resolves resources in declaration order", () => {
  const result = resolveExampleResources({
    resources: [
      "@/libs/polygon-clipping/polygon-clipping.umd.min.js",
      "map.css",
      "/img/div-graphic/divGraphic.css",
      "https://cdn.example.com/plugin.js",
    ],
    exampleMain: "layer-graphic/geojson/mask",
    baseUrl: "https://example.com/cesium-example/",
    libraryResourceUrls: {
      "/src/libs/polygon-clipping/polygon-clipping.umd.min.js":
        "/cesium-example/assets/polygon-clipping.123.js",
    },
    exampleResourceUrls: {
      "/src/example/layer-graphic/geojson/mask/map.css":
        "/cesium-example/assets/mask.456.css",
    },
  });

  assert.deepEqual(result, [
    {
      label: "@/libs/polygon-clipping/polygon-clipping.umd.min.js",
      url: "/cesium-example/assets/polygon-clipping.123.js",
    },
    { label: "map.css", url: "/cesium-example/assets/mask.456.css" },
    {
      label: "/img/div-graphic/divGraphic.css",
      url: "https://example.com/cesium-example/img/div-graphic/divGraphic.css",
    },
    {
      label: "https://cdn.example.com/plugin.js",
      url: "https://cdn.example.com/plugin.js",
    },
  ]);
});

test("rejects an unresolved packaged resource", () => {
  assert.throws(
    () =>
      resolveExampleResources({
        resources: ["missing.js"],
        exampleMain: "layer-graphic/geojson/mask",
        baseUrl: "https://example.com/",
        libraryResourceUrls: {},
        exampleResourceUrls: {},
      }),
    /Unable to resolve example resource: missing\.js/,
  );
});
```

- [ ] **Step 2: Run the test and verify the module is missing**

Run:

```bash
node --test tests/example-resources.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `example-resources.mjs`.

- [ ] **Step 3: Implement the pure resolver**

```js
const externalUrlPattern = /^(?:https?:)?\/\//i;

export function findCatalogItemByMain(items, main) {
  for (const item of items || []) {
    if (item.main === main) return item;
    const childMatch = findCatalogItemByMain(item.children, main);
    if (childMatch) return childMatch;
  }
  return undefined;
}

export function resolveExampleResources({
  resources = [],
  exampleMain,
  baseUrl,
  libraryResourceUrls,
  exampleResourceUrls,
}) {
  return resources.map((label) => {
    if (externalUrlPattern.test(label)) return { label, url: label };

    if (label.startsWith("/")) {
      return {
        label,
        url: new URL(label.replace(/^\/+/, ""), baseUrl).href,
      };
    }

    const sourcePath = label.startsWith("@/libs/")
      ? `/src/${label.slice(2)}`
      : `/src/example/${exampleMain}/${label.replace(/^\.\//, "")}`;
    const url = label.startsWith("@/libs/")
      ? libraryResourceUrls[sourcePath]
      : exampleResourceUrls[sourcePath];

    if (!url) throw new Error(`Unable to resolve example resource: ${label}`);
    return { label, url };
  });
}
```

- [ ] **Step 4: Run the resolver tests**

Run:

```bash
node --test tests/example-resources.test.mjs
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit the resolver unit**

```bash
git add src/components/code-editor/example-resources.mjs tests/example-resources.test.mjs
git commit -m "feat: resolve example resource urls"
```

### Task 2: Resource Popover and New-Tab Links

**Files:**
- Modify: `src/components/code-editor/index.vue`
- Create: `tests/code-editor-resources.test.mjs`

**Interfaces:**
- Consumes: `findCatalogItemByMain` and `resolveExampleResources` from Task 1, `example.json`, and Vite URL glob records.
- Produces: reactive `resources` descriptors passed to `<Map :resources="resources">` and anchors with `target="_blank"` and `rel="noopener noreferrer"`.

- [ ] **Step 1: Write the failing editor integration-contract test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const editorPath = new URL(
  "../src/components/code-editor/index.vue",
  import.meta.url,
);

test("shows ordered resources as safe new-tab links", async () => {
  const source = await readFile(editorPath, "utf8");
  assert.match(source, /当前示例依赖的资源文件（请注意顺序）/);
  assert.match(source, /v-for="resource in resources"/);
  assert.match(source, /:href="resource\.url"/);
  assert.match(source, /target="_blank"/);
  assert.match(source, /rel="noopener noreferrer"/);
});

test("passes resolved resources to the preview component", async () => {
  const source = await readFile(editorPath, "utf8");
  assert.match(source, /<Map[^>]*:resources="resources"/s);
  assert.match(source, /import\.meta\.glob\("\/src\/libs\/\*\*\/\*\.\{js,css\}"/);
  assert.match(source, /import\.meta\.glob\("\/src\/example\/\*\*\/\*\.\{js,css\}"/);
});
```

- [ ] **Step 2: Run the test and verify the popover contract is absent**

Run:

```bash
node --test tests/code-editor-resources.test.mjs
```

Expected: FAIL on the missing resource heading or `:resources` binding.

- [ ] **Step 3: Resolve the active catalog entry and its URLs**

Add these imports and URL tables in `index.vue`:

```js
import catalog from "@/config/example.json";
import {
  findCatalogItemByMain,
  resolveExampleResources,
} from "./example-resources.mjs";

const libraryResourceUrls = import.meta.glob("/src/libs/**/*.{js,css}", {
  eager: true,
  query: "?url",
  import: "default",
});
const exampleResourceUrls = import.meta.glob("/src/example/**/*.{js,css}", {
  eager: true,
  query: "?url",
  import: "default",
});
const resources = ref([]);

function resolveCurrentResources() {
  const item = findCatalogItemByMain(catalog, url.value);
  resources.value = resolveExampleResources({
    resources: item?.resources,
    exampleMain: url.value,
    baseUrl: new URL(import.meta.env.BASE_URL, window.location.origin).href,
    libraryResourceUrls,
    exampleResourceUrls,
  });
}
```

Call `resolveCurrentResources()` inside the existing `onMounted` `try` block before the first `run()` is reached.

- [ ] **Step 4: Add the resource popover and preview prop**

Import Element Plus's `Link` icon alongside the existing icons and add this next to the JS icon:

```vue
<el-popove
  v-if="resources.length"
  placement="bottom-start"
  trigger="click"
  :width="320"
  popper-class="example-resource-popover"
>
  <template #reference>
    <button class="resource-trigger" type="button" title="依赖资源">
      <el-icon><Link /></el-icon>
    </button>
  </template>
  <div class="resource-title">当前示例依赖的资源文件（请注意顺序）</div>
  <a
    v-for="resource in resources"
    :key="resource.label"
    class="resource-link"
    :href="resource.url"
    target="_blank"
    rel="noopener noreferrer"
  >
    {{ resource.label }}
  </a>
</el-popover>
```

Change the preview invocation to:

```vue
<Map ref="mapRef" :url="url" :resources="resources"></Map>
```

Add scoped trigger styles and global popover styles that match the existing 24px header controls and provide a vertically ordered link list:

```scss
.resource-trigger {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 2px;
  color: #fff;
  background: #3ea6ff;
  cursor: pointer;
}

.example-resource-popover .resource-title {
  padding-bottom: 10px;
  font-weight: 600;
}
.example-resource-popover .resource-link {
  display: block;
  padding: 8px 10px;
  color: #409eff;
  overflow-wrap: anywhere;
}
.example-resource-popover .resource-link:hover {
  background: #ecf5ff;
}
```

- [ ] **Step 5: Run resolver and editor tests**

Run:

```bash
node --test tests/example-resources.test.mjs tests/code-editor-resources.test.mjs
```

Expected: 5 tests PASS.

- [ ] **Step 6: Commit the editor UI unit**

```bash
git add src/components/code-editor/index.vue tests/code-editor-resources.test.mjs
git commit -m "feat: show example dependency resources"
```

### Task 3: Sequential Runner Resource Loading

**Files:**
- Create: `src/pages/runner/resource-loader.mjs`
- Create: `src/pages/runner/resource-loader.d.mts`
- Modify: `src/pages/runner/main.ts`
- Modify: `src/components/code-editor/map.vue`
- Create: `tests/runner-resource-loader.test.mjs`

**Interfaces:**
- Consumes: ordered `ResolvedResource[]` from Task 2.
- Produces: `loadResources(resources, documentObject?) => Promise<void>` and `runner.run(code, exampleId, resources)`.

- [ ] **Step 1: Write the failing loader behavior tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  getResourceKind,
  loadResources,
} from "../src/pages/runner/resource-loader.mjs";

function createFakeDocument({ failUrl } = {}) {
  const events = [];
  const appended = [];
  return {
    appended,
    events,
    documentObject: {
      createElement(tagName) {
        const listeners = {};
        return {
          tagName,
          addEventListener(name, handler) {
            listeners[name] = handler;
          },
          dispatch(name) {
            listeners[name]?.();
          },
        };
      },
      head: {
        append(element) {
          const url = element.src || element.href;
          appended.push({ tagName: element.tagName, url, rel: element.rel });
          events.push(`append:${url}`);
          queueMicrotask(() => {
            events.push(`complete:${url}`);
            element.dispatch(url === failUrl ? "error" : "load");
          });
        },
      },
    },
  };
}

test("classifies resources from the URL pathname", () => {
  assert.equal(getResourceKind("/assets/plugin.js?v=1"), "script");
  assert.equal(getResourceKind("/assets/theme.css#main"), "style");
  assert.throws(() => getResourceKind("/assets/data.json"), /Unsupported/);
});

test("loads scripts and styles sequentially in declaration order", async () => {
  const fake = createFakeDocument();
  await loadResources(
    [
      { label: "plugin.js", url: "/assets/plugin.js" },
      { label: "theme.css", url: "/assets/theme.css" },
    ],
    fake.documentObject,
  );
  assert.deepEqual(fake.appended, [
    { tagName: "script", url: "/assets/plugin.js", rel: undefined },
    { tagName: "link", url: "/assets/theme.css", rel: "stylesheet" },
  ]);
  assert.deepEqual(fake.events, [
    "append:/assets/plugin.js",
    "complete:/assets/plugin.js",
    "append:/assets/theme.css",
    "complete:/assets/theme.css",
  ]);
});
test("reports the resource that failed to load", async () => {
  const fake = createFakeDocument({ failUrl: "/assets/broken.js" });
  await assert.rejects(
    loadResources(
      [{ label: "broken.js", url: "/assets/broken.js" }],
      fake.documentObject,
    ),
    /Failed to load example resource: broken\.js \(\/assets\/broken\.js\)/,
  );
});
```

- [ ] **Step 2: Run the test and verify the loader module is missing**

Run:

```bash
node --test tests/runner-resource-loader.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `resource-loader.mjs`.

- [ ] **Step 3: Implement resource classification and ordered loading**

```js
export function getResourceKind(url) {
  const pathname = new URL(url, "http://localhost").pathname.toLowerCase();
  if (pathname.endsWith(".css")) return "style";
  if (/\.(?:c|m)?js$/.test(pathname)) return "script";
  throw new Error(`Unsupported example resource type: ${url}`);
}

function appendAndWait(element, parent, resource) {
  return new Promise((resolve, reject) => {
    element.addEventListener("load", resolve, { once: true });
    element.addEventListener(
      "error",
      () =>
        reject(
          new Error(
            `Failed to load example resource: ${resource.label} (${resource.url})`,
          ),
        ),
      { once: true },
    );
    parent.append(element);
  });
}

export async function loadResources(resources, documentObject = document) {
  for (const resource of resources) {
    const kind = getResourceKind(resource.url);
    const element = documentObject.createElement(
      kind === "style" ? "link" : "script",
    );
    if (kind === "style") {
      element.rel = "stylesheet";
      element.href = resource.url;
    } else {
      element.src = resource.url;
    }
    await appendAndWait(element, documentObject.head, resource);
  }
}
```

Declare the strict interface in `resource-loader.d.mts`:

```ts
export type ResolvedResource = Readonly<{
  label: string;
  url: string;
}>;

export function getResourceKind(url: string): "script" | "style";
export function loadResources(
  resources: readonly ResolvedResource[],
  documentObject?: Document,
): Promise<void>;
```

- [ ] **Step 4: Wire resources through the preview and runner**

Add an optional array prop in `map.vue`:

```js
resources: {
  type: Array,
  default: () => [],
},
```

Pass it when running:

```js
const result = await runner.run(task.code, props.url, props.resources);
```

In `src/pages/runner/main.ts`, import the loader and its type:

```ts
import {
  loadResources,
  type ResolvedResource,
} from "./resource-loader.mjs";
```

Extend `run` and load dependencies immediately after disposal and before source transformation:

```ts
async function run(
  code: string,
  exampleId: string,
  resources: ResolvedResource[] = [],
) {
  await dispose();
  await loadResources(resources);
  const transformed = await transformRuntimeImports(code);
```

- [ ] **Step 5: Run loader and integration tests**

Run:

```bash
node --test tests/runner-resource-loader.test.mjs tests/code-editor-resources.test.mjs
```

Expected: 5 tests PASS.

- [ ] **Step 6: Commit the runner loading unit**

```bash
git add src/pages/runner/resource-loader.mjs src/pages/runner/resource-loader.d.mts src/pages/runner/main.ts src/components/code-editor/map.vue tests/runner-resource-loader.test.mjs
git commit -m "feat: load declared example resources"
```

### Task 4: Polygon-Clipping Mask Integration

**Files:**
- Modify: `src/config/example.json:108-120`
- Modify: `src/example/layer-graphic/geojson/mask/map.js:1-40`
- Track: `src/libs/polygon-clipping/polygon-clipping.umd.min.js`
- Create: `tests/geojson-mask-resource.test.mjs`

**Interfaces:**
- Consumes: `resources` loading from Tasks 1-3 and the UMD-created `globalThis.polygonClipping` object.
- Produces: exported `difference(subject, ...clipGeometries)` for the example to perform polygon differences through the loaded dependency.

- [ ] **Step 1: Write the failing mask resource integration test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { findCatalogItemByMain } from "../src/components/code-editor/example-resources.mjs";

const configPath = new URL("../src/config/example.json", import.meta.url);
const mapPath = new URL(
  "../src/example/layer-graphic/geojson/mask/map.js",
  import.meta.url,
);

test("declares the polygon-clipping UMD resource", async () => {
  const catalog = JSON.parse(await readFile(configPath, "utf8"));
  const item = findCatalogItemByMain(catalog, "layer-graphic/geojson/mask");
  assert.deepEqual(item.resources, [
    "@/libs/polygon-clipping/polygon-clipping.umd.min.js",
  ]);
});

test("uses and validates the polygonClipping UMD global", async () => {
  const source = await readFile(mapPath, "utf8");
  assert.match(source, /globalThis\.polygonClipping/);
  assert.match(source, /typeof library\.difference !== "function"/);
  assert.match(source, /export function difference\(subject, \.\.\.clipGeometries\)/);
  assert.match(source, /library\.difference\(subject, \.\.\.clipGeometries\)/);
});
```

- [ ] **Step 2: Run the test and verify the declaration and API are absent**

Run:

```bash
node --test tests/geojson-mask-resource.test.mjs
```

Expected: 2 tests FAIL because the resource entry and wrapper do not exist.

- [ ] **Step 3: Declare the UMD resource for the mask catalog item**

Add this beside the mask entry's `main` and `api` fields in `src/config/example.json`:

```json
"resources": [
  "@/libs/polygon-clipping/polygon-clipping.umd.min.js"
]
```

- [ ] **Step 4: Validate and wrap the loaded polygon-clipping API**

Add this near the top of the mask `map.js`:

```js
function getPolygonClipping() {
  const library = globalThis.polygonClipping;
  if (!library || typeof library.difference !== "function") {
    throw new Error(
      "polygon-clipping is unavailable. Check this example's resources configuration.",
    );
  }
  return library;
}

export function difference(subject, ...clipGeometries) {
  const library = getPolygonClipping();
  return library.difference(subject, ...clipGeometries);
}
```

Call `getPolygonClipping()` at the start of `onMounted()` so a missing or incorrectly ordered resource fails before Cesium viewer creation.

- [ ] **Step 5: Run all focused tests**

Run:

```bash
node --test tests/example-resources.test.mjs tests/code-editor-resources.test.mjs tests/runner-resource-loader.test.mjs tests/geojson-mask-resource.test.mjs
```

Expected: 10 tests PASS.

- [ ] **Step 6: Run the production build**

Run:

```bash
pnpm build
```

Expected: `vue-tsc -b` and `vite build` exit successfully; polygon-clipping is emitted as a build asset.

- [ ] **Step 7: Commit the mask integration**

```bash
git add src/config/example.json src/example/layer-graphic/geojson/mask/map.js src/libs/polygon-clipping/polygon-clipping.umd.min.js tests/geojson-mask-resource.test.mjs
git commit -m "feat: provide polygon clipping to mask example"
```

### Task 5: Browser Verification

**Files:**
- Verify only; no file changes expected.

**Interfaces:**
- Consumes: the completed editor resource UI, runner loader, and mask declaration.
- Produces: browser evidence that the dependency is visible, openable, and available before `map.js` executes.

- [ ] **Step 1: Start the development server**

Run:

```bash
pnpm run dev --host 0.0.0.0 --port 5174
```

Expected: Vite reports the editor site available on port 5174.

- [ ] **Step 2: Open the mask editor**

Open:

```text
http://localhost:5174/editor-vue.html?id=layer-graphic%2Fgeojson%2Fmask
```

Expected: the example runs without `polygon-clipping is unavailable` or resource-load errors.

- [ ] **Step 3: Verify the resource popover**

Click the resource-link icon beside the JS icon.

Expected: the popover heading is `当前示例依赖的资源文件（请注意顺序）` and the ordered list contains `@/libs/polygon-clipping/polygon-clipping.umd.min.js`.

- [ ] **Step 4: Verify new-tab source display**

Click the polygon-clipping list item.

Expected: a new browser tab opens the emitted JavaScript resource, whose first wrapper assigns `globalThis.polygonClipping` (minified spelling may differ while behavior remains equivalent).

- [ ] **Step 5: Verify an example without resources**

Open any catalog example that has no `resources` field.

Expected: no resource-link icon is rendered and the example still runs normally.
