import MultiTerrainClip from "@class/MultiTerrainClip";

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
  add3dtiles();

  setTimeout(() => {
    const terrainClip = new MultiTerrainClip(viewer, {
      stylePit: {
        diffHeight: 30, // 井的深度
        image: "/img/textures/poly-stone.jpg",
        imageBottom: "/img/textures/poly-soil.jpg",
        splitNum: 50, // 井边界插值数
      },
    });

    terrainClip.addArea([
      [117.212459, 31.845379, 42.83],

      [117.214264, 31.845386, 42.83],
      [117.214291, 31.843833, 42.83],
      [117.212451, 31.843854, 42.83],
    ]);
  }, 5000);
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}

export function flyTo() {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(117.21586, 30.827414, 554),
    orientation: {
      heading: Cesium.Math.toRadians(0), // 朝北（0 弧度）
      pitch: Cesium.Math.toRadians(-56), // 向下俯视 30 度
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
}

async function add3dtiles() {
  const url = "http://data.mars3d.cn/3dtiles/max-piping/tileset.json";
  const tileset = await Cesium.Cesium3DTileset.fromUrl(url);
  // 将 tileset 添加到场景中
  viewer.scene.primitives.add(tileset);
  // 飞行到 3D Tiles 位置
  await viewer.flyTo(tileset, {
    duration: 2, // 飞行时间（秒）
    offset: new Cesium.HeadingPitchRange(
      0, // 航向角
      Cesium.Math.toRadians(-45), // 俯仰角（向下看）
      tileset.boundingSphere.radius * 2, // 相机距离
    ),
  });
}
