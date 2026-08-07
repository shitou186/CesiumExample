export let viewer;

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

export function onMounted() {
  getPolygonClipping();
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
    contextOptions: {
      webgl: {
        alpha: true,
      },
    },
  });
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}

//  center: { lat: 31.795863, lng: 117.212909, alt: 2113, heading: 25, pitch: -34 }
export function flyTo() {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(117.212909, 31.795863, 2113),
    orientation: {
      heading: Cesium.Math.toRadians(25), // 朝北（0 弧度）
      pitch: Cesium.Math.toRadians(-34), // 向下俯视 30 度
      roll: 0, // 不滚动
    },
    duration: 0,
  });
}
// 数据获取 https://datav.aliyun.com/portal/school/atlas/area_generator
function addGeoJson() {}
