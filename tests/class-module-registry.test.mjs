import assert from "node:assert/strict";
import test from "node:test";
import { createClassModuleRegistry } from "../src/pages/runner/class-module-registry.mjs";

test("registers class files under namespaced aliases", () => {
  const multiTerrainClipLoader = async () => ({ default: class {} });
  const nestedLoader = async () => ({ helper: true });

  const registry = createClassModuleRegistry({
    "/src/class/MultiTerrainClip.js": multiTerrainClipLoader,
    "/src/class/terrain/NestedTool.ts": nestedLoader,
  });

  assert.deepEqual(Object.keys(registry.loaders), [
    "@class/MultiTerrainClip",
    "@class/terrain/NestedTool",
  ]);
  assert.equal(
    registry.loaders["@class/MultiTerrainClip"],
    multiTerrainClipLoader,
  );
  assert.equal(registry.loaders["@class/terrain/NestedTool"], nestedLoader);
  assert.deepEqual(registry.aliases, {
    "@class/MultiTerrainClip": "@class/MultiTerrainClip",
    "@class/terrain/NestedTool": "@class/terrain/NestedTool",
  });
});

test("rejects class files that collapse to the same alias", () => {
  assert.throws(
    () =>
      createClassModuleRegistry({
        "/src/class/Duplicate.js": async () => ({}),
        "/src/class/Duplicate.ts": async () => ({}),
      }),
    /Duplicate class module alias: @class\/Duplicate/,
  );
});
