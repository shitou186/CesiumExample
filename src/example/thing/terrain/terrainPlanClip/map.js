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

  setTimeout(() => {
    const terrainClip = new MultiTerrainClip(viewer, {
      stylePit: {
        diffHeight: 50, // 井的深度
        image: "/img/textures/poly-stone.jpg",
        imageBottom: "/img/textures/poly-soil.jpg",
        splitNum: 80, // 井边界插值数
      },
    });

    terrainClip.addArea(
      [
        [116.334222, 30.899171, 645.46],
        [116.370874, 30.899171, 645.46],
        [116.370874, 30.944509, 645.46],
        [116.334222, 30.944509, 645.46],
      ],
      { diffHeight: 900, exact: true },
    );

    terrainClip.addArea(
      [
        [116.416497, 30.934256, 775.89],
        [116.427392, 30.962941, 1084.88],
        [116.434838, 30.932608, 900.43],
        [116.462994, 30.923081, 771.42],
        [116.437571, 30.916044, 906.39],
        [116.44977, 30.894487, 776.06],
        [116.424183, 30.908752, 727.02],
        [116.402218, 30.898406, 593.08],
        [116.414309, 30.918806, 588.78],
        [116.387022, 30.933539, 700.65],
      ],
      { diffHeight: 200, exact: true },
    );
  }, 2000);
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}

export function flyTo() {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.378229, 30.827414, 16933),
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
