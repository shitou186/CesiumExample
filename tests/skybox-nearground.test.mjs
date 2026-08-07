import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { afterEach } from "node:test";

const mapPath = new URL(
  "../src/example/map/property/skybox-nearground/map.js",
  import.meta.url,
);
const controlsPath = new URL(
  "../src/example/map/property/skybox-nearground/index.vue",
  import.meta.url,
);

async function loadMapModule() {
  const source = await readFile(mapPath, "utf8");
  return import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}#${Date.now()}-${Math.random()}`
  );
}

function installCesiumHarness() {
  const scene = {
    primitives: {
      add(primitive) {
        this.lastAdded = primitive;
        return primitive;
      },
      remove() {},
    },
    requestRender() {},
    skyBox: { show: true },
    skyAtmosphere: { show: true },
    sun: { show: true },
    moon: { show: true },
  };
  const viewer = {
    camera: { flyTo() {} },
    scene,
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
    CubeMapPanorama: class {
      constructor(options) {
        Object.assign(this, options);
      }
    },
    Ellipsoid: { WGS84: {} },
    Math: { toRadians: (value) => value },
    Matrix3: class {},
    Matrix4: class {
      static getMatrix3(_matrix4, matrix3) {
        return matrix3;
      }
    },
    Transforms: {
      eastNorthUpToFixedFrame() {
        return {};
      },
    },
  };
}

afterEach(() => {
  delete globalThis.Cesium;
});

test("loads wanxia with front/back on Y and up/down on Z", async () => {
  installCesiumHarness();
  const map = await loadMapModule();
  map.onMounted();
  map.setScene("wanxia");

  const sources = map.viewer.scene.primitives.lastAdded?.sources;
  assert.equal(
    sources?.positiveY,
    "./img/skybox-near/wanxia/SunSetFront.png",
  );
  assert.equal(
    sources?.negativeY,
    "./img/skybox-near/wanxia/SunSetBack.png",
  );
  assert.equal(sources?.positiveZ, "./img/skybox-near/wanxia/SunSetUp.png");
  assert.equal(
    sources?.negativeZ,
    "./img/skybox-near/wanxia/SunSetDown.png",
  );
});

test("sends the qingtian type when the 晴天 control is clicked", async () => {
  const controls = await readFile(controlsPath, "utf8");

  assert.match(controls, /@click="handle\('qingtian'\)"/);
});
