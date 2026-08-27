import MultipleCubeMapPanorama from "@class/MultipleCubeMapPanorama";
export let viewer;

const SKYBOX_SOURCES = {
  qingtian: {
    positiveX: "./img/skybox-near/qingtian/rightav9.jpg",
    negativeX: "./img/skybox-near/qingtian/leftav9.jpg",
    positiveY: "./img/skybox-near/qingtian/frontav9.jpg",
    negativeY: "./img/skybox-near/qingtian/backav9.jpg",
    positiveZ: "./img/skybox-near/qingtian/topav9.jpg",
    negativeZ: "./img/skybox-near/qingtian/bottomav9.jpg",
  },
  wanxia: {
    positiveX: "./img/skybox-near/wanxia/SunSetRight.png",
    negativeX: "./img/skybox-near/wanxia/SunSetLeft.png",
    positiveY: "./img/skybox-near/wanxia/SunSetFront.png",
    negativeY: "./img/skybox-near/wanxia/SunSetBack.png",
    positiveZ: "./img/skybox-near/wanxia/SunSetUp.png",
    negativeZ: "./img/skybox-near/wanxia/SunSetDown.png",
  },
  night: {
    positiveX: "./img/skybox/2/tycho2t3_80_px.jpg",
    negativeX: "./img/skybox/2/tycho2t3_80_mx.jpg",
    positiveY: "./img/skybox/2/tycho2t3_80_py.jpg",
    negativeY: "./img/skybox/2/tycho2t3_80_my.jpg",
    positiveZ: "./img/skybox/2/tycho2t3_80_pz.jpg",
    negativeZ: "./img/skybox/2/tycho2t3_80_mz.jpg",
  },
};

let nearGroundSky;
let transitionValue = 0;
let sliderSyncFrame;

function syncTransitionSlider() {
  const sliders = window.parent.document.querySelectorAll(
    ".el-slider [role=slider]",
  );
  const slider = Array.from(sliders).find(
    (item) =>
      Number(item.getAttribute("aria-valuemin")) === 0 &&
      Number(item.getAttribute("aria-valuemax")) === 2,
  );

  if (slider) {
    const value = Number(slider.getAttribute("aria-valuenow"));
    if (Number.isFinite(value) && value !== transitionValue) setScene(value);
  }

  sliderSyncFrame = requestAnimationFrame(syncTransitionSlider);
}

export function onMounted() {
  viewer = new Cesium.Viewer("cesiumContainer", {
    fxaa: true,
    fullscreenButton: false,
    vrButton: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    baseLayerPicker: false,
    navigationHelpButton: false,
    infoBox: false,
    attribution: false,
    contextOptions: {
      webgl: { alpha: true },
    },
  });

  flyTo();
  cubeMapPanorama();
  syncTransitionSlider();
}

export function onUnmounted() {
  if (sliderSyncFrame) cancelAnimationFrame(sliderSyncFrame);
  sliderSyncFrame = undefined;
  nearGroundSky = undefined;
  if (viewer && !viewer.isDestroyed()) viewer.destroy();
  viewer = undefined;
}

export function flyTo() {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.277645, 30.400638, 8450),
    orientation: {
      heading: Cesium.Math.toRadians(5.3),
      pitch: Cesium.Math.toRadians(-16),
      roll: 0,
    },
    duration: 2,
  });
}

function createLocalTransform() {
  const center = Cesium.Cartesian3.fromDegrees(
    114.08354267477988,
    30.384656638019795,
    100,
  );
  const localFrame = Cesium.Transforms.eastNorthUpToFixedFrame(
    center,
    Cesium.Ellipsoid.WGS84,
    new Cesium.Matrix4(),
  );
  return Cesium.Matrix4.getMatrix3(localFrame, new Cesium.Matrix3());
}

function hideDefaultSky() {
  const scene = viewer.scene;
  if (scene.skyBox) scene.skyBox.show = false;
  if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;
  if (scene.sun) scene.sun.show = false;
  if (scene.moon) scene.moon.show = false;
}

export function cubeMapPanorama() {
  const scene = viewer.scene;
  if (nearGroundSky) scene.primitives.remove(nearGroundSky);
  hideDefaultSky();

  nearGroundSky = scene.primitives.add(
    new MultipleCubeMapPanorama({
      context: scene.context,
      sources: SKYBOX_SOURCES,
      transform: createLocalTransform(),
      value: transitionValue,
    }),
  );
  nearGroundSky.readyPromise
    .then(() => scene.requestRender())
    .catch((error) => console.error("近地天空盒加载失败", error));
}

/**
 * 滑块值：0=晴天，0.5=晴天/晚霞各50%，1=晚霞，2=夜晚。
 */
export function setScene(value) {
  const number = Number(value);
  transitionValue = Cesium.Math.clamp(
    Number.isFinite(number) ? number : 0,
    0,
    2,
  );
  if (nearGroundSky) nearGroundSky.value = transitionValue;
  viewer?.scene.requestRender();
}
