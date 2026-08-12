import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("compare releases render listeners, DOM listeners, and viewers", async () => {
  const source = await readFile(
    new URL("../src/example/map/double/compare/map.js", import.meta.url),
    "utf8",
  );
  const removedDomListeners = [];
  const removedRenderListeners = [];
  const destroyed = [];

  class FakeViewer {
    constructor(id) {
      this.id = id;
      this.camera = { setView() {} };
      this.container = {
        addEventListener() {},
        removeEventListener: (name, handler) =>
          removedDomListeners.push([id, name, handler]),
      };
      this.scene = {
        postRender: {
          addEventListener: (handler) => () =>
            removedRenderListeners.push([id, handler]),
        },
      };
    }

    isDestroyed() {
      return false;
    }

    destroy() {
      destroyed.push(this.id);
    }
  }

  globalThis.Cesium = { Viewer: FakeViewer };
  const module = await import(
    `data:text/javascript,${encodeURIComponent(source)}#${Date.now()}`
  );

  module.onMounted();
  module.onUnmounted();

  assert.equal(removedRenderListeners.length, 2);
  assert.deepEqual(
    removedDomListeners.map(([id, name]) => [id, name]),
    [
      ["leftViewer", "mouseenter"],
      ["rightViewer", "mouseenter"],
    ],
  );
  assert.deepEqual(destroyed, ["leftViewer", "rightViewer"]);
  assert.equal(module.leftViewer, undefined);
  assert.equal(module.rightViewer, undefined);
});
