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
  viewer.scene.globe.depthTestAgainstTerrain = true;
  flyTo();
  addTerrain();
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}

export function flyTo() {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.475196, 30.615012, 24043.2),
    orientation: {
      heading: Cesium.Math.toRadians(355.3), // 朝北（0 弧度）
      pitch: Cesium.Math.toRadians(-38), // 向下俯视 30 度
      roll: 0, // 不滚动
    },
    duration: 2,
  });
}

async function addTerrain() {
  const url = "http://data.mars3d.cn/terrain";
  const provider = await Cesium.CesiumTerrainProvider.fromUrl(url, {
    requestVertexNormals: true, // 光照法线
    requestWaterMask: true, // 水面效果
  });
  viewer.terrainProvider = provider;
  // 地形夸张10倍
  viewer.scene.verticalExaggeration = 10;
}
