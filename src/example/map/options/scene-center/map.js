export let viewer;

export function onMounted() {
  viewer = new Cesium.Viewer("cesiumContainer", {
    // 抗锯齿
    fxaa: true,
    // 禁用时间轴
    timeline: false,
    // 禁用底部时间控制器（动画播放控件）
    animation: false,
    // 禁用全屏按钮
    fullscreenButton: false,
    // 禁用 VR 按钮
    vrButton: false,
    // 禁用地理编码器（搜索框）
    geocoder: false,
    // 禁用 home 按钮（重置视角）
    homeButton: false,
    // 禁用场景模式选择器（2D/3D/Columbus View 切换）
    sceneModePicker: false,
    // 禁用基础图层选择器
    baseLayerPicker: false,
    // 禁用导航说明（左上角的帮助提示）
    navigationHelpButton: false,
    // 禁用信息框（点击实体时弹出的信息窗口）
    infoBox: false,
    attribution: false,
  });
  flyTo();
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}

export function flyTo(key = "default") {
  switch (key) {
    case "flyTo":
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          112.22391,
          26.4526,
          11445496,
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0), // 朝北（0 弧度）
          pitch: Cesium.Math.toRadians(-90), // 向下俯视 30 度
          roll: 0, // 不滚动
        },
        duration: 2,
      });
      break;

    case "point":
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          113.722391,
          27.774526,
          45496,
        ),
      });
      break;

    default:
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          112.722391,
          26.774526,
          755496,
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0), // 朝北（0 弧度）
          pitch: Cesium.Math.toRadians(-90), // 向下俯视 30 度
          roll: 0, // 不滚动
        },
        duration: 2,
      });
      break;
  }
}

export function getViewer() {
  return viewer;
}

/**
 * 获取 Cesium 当前相机状态
 * @param {Cesium.Scene} scene
 */
export function getCameraView() {
  const scene = viewer.scene;
  if (!scene || !scene.camera) {
    console.error("scene 或 scene.camera 不存在");
  }
  const camera = scene.camera;
  const cartographic = camera.positionCartographic;
  const precision = 6;
  const fixed = (value, digits = precision) => Number(value.toFixed(digits));

  return {
    lon: fixed(Cesium.Math.toDegrees(cartographic.longitude)),
    lng: fixed(Cesium.Math.toDegrees(cartographic.longitude)),
    lat: fixed(Cesium.Math.toDegrees(cartographic.latitude)),
    alt: fixed(cartographic.height, 2),
    heading: fixed(Cesium.Math.toDegrees(camera.heading), 2),
    pitch: fixed(Cesium.Math.toDegrees(camera.pitch), 2),
    roll: fixed(Cesium.Math.toDegrees(camera.roll), 2),
  };
}

export function openListener() {
  return viewer.scene.camera.moveEnd.addEventListener(() => getCameraView());
}
