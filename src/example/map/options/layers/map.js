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
  // 开启帧率
  viewer.scene.debugShowFramesPerSecond = true;
  flyTo();
  loadTerrain();
  addLayer();
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}

export function flyTo() {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(120.832996, 27.79615, 1429853.2),
    orientation: {
      heading: Cesium.Math.toRadians(7), // 朝北（0 弧度）
      pitch: Cesium.Math.toRadians(-78), // 向下俯视 30 度
      roll: 0, // 不滚动
    },
    duration: 2,
  });
}

//地形加载
async function loadTerrain() {
  // console.log("加载地形");
  const url = "http://data.mars3d.cn/terrain";
  viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(url, {
    requestVertexNormals: true,
    requestWaterMask: true,
  });
}

function addLayer() {
  const xyz = new Cesium.UrlTemplateImageryProvider({
    credit: "xyz服务",
    url: "//data.mars3d.cn/tile/dizhiChina/{z}/{x}/{y}.png",
    rectangle: Cesium.Rectangle.fromDegrees(
      69.706929,
      15.831038,
      136.560941,
      52.558005,
    ),
  });
  viewer.imageryLayers.addImageryProvider(xyz);
}
