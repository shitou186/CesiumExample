import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getResourceKind,
  loadResources,
} from "../src/pages/runner/resource-loader.mjs";

function createFakeDocument({ failUrl } = {}) {
  const appended = [];
  const events = [];

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

test("loads declared resources before transforming the example source", async () => {
  const [runnerSource, previewSource] = await Promise.all([
    readFile(new URL("../src/pages/runner/main.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../src/components/code-editor/map.vue", import.meta.url),
      "utf8",
    ),
  ]);

  const loadIndex = runnerSource.indexOf("await loadResources(resources)");
  const transformIndex = runnerSource.indexOf(
    "await transformRuntimeImports(code)",
  );
  assert.notEqual(loadIndex, -1);
  assert.ok(loadIndex < transformIndex);
  assert.match(
    previewSource,
    /runner\.run\(task\.code, props\.url, props\.resources\)/,
  );
});