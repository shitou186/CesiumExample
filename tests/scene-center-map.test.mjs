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
    setView() {},
    positionCartographic: {
      longitude: 1,
      latitude: 0.5,
      height: 1234.567,
    },
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

test("reads camera coordinates from positionCartographic", async () => {
  installCesiumHarness();
  const map = await loadMapModule();
  map.onMounted();

  const view = map.getCameraView();

  assert.equal(view.lon, 57.29578);
  assert.equal(view.lat, 28.64789);
  assert.equal(view.alt, 1234.57);
});

test("returns Cesium's moveEnd listener disposer", async () => {
  const harness = installCesiumHarness();
  const map = await loadMapModule();
  map.onMounted();

  const removeListener = map.openListener();

  assert.equal(removeListener, harness.removeListener);
  assert.doesNotThrow(() => harness.moveEnd());
});
