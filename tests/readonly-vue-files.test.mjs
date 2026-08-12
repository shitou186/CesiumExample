import assert from "node:assert/strict";
import test from "node:test";

import { buildReadonlyVueFiles } from "../src/components/code-editor/readonly-vue-files.mjs";

test("builds scene layout and operation panel entries", () => {
  assert.deepEqual(
    buildReadonlyVueFiles({ viewSource: "view", panelSource: "panel" }),
    [
      { key: "view", label: "场景布局", source: "view" },
      { key: "panel", label: "操作面板", source: "panel" },
    ],
  );
});

test("omits Vue files that do not exist", () => {
  assert.deepEqual(buildReadonlyVueFiles({ viewSource: "view" }), [
    { key: "view", label: "场景布局", source: "view" },
  ]);
  assert.deepEqual(buildReadonlyVueFiles({}), []);
});
