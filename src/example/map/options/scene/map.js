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
  loadTerrain();
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}

export function flyTo() {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(112.722391, 26.774526, 11445496),
    orientation: {
      heading: Cesium.Math.toRadians(0), // 朝北（0 弧度）
      pitch: Cesium.Math.toRadians(-90), // 向下俯视 30 度
      roll: 0, // 不滚动
    },
    duration: 2,
  });
}

//地形加载
async function loadTerrain() {
  // console.log("加载地形");
  const url = "https://data.mars3d.cn/terrain";
  viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(url, {
    requestVertexNormals: true,
    requestWaterMask: true,
  });
}

// 场景设置
export function changeScene(key, value) {
  switch (key) {
    case "sceneMode":
      //场景模式 2D 3D 哥伦布视图
      viewer.scene.mode = value;
      break;
    case "highDynamicRange":
      //高动态渲染
      viewer.scene.highDynamicRange = value;
      break;
    case "fxaa":
      //抗锯齿开关
      viewer.scene.fxaa = value;
      break;
    case "sun":
      //太阳 显隐
      viewer.scene.sun.show = value;
      break;
    case "moon":
      //月亮 显隐
      viewer.scene.moon.show = value;
      break;
    case "skyBox":
      //天空盒 显隐
      viewer.scene.skyBox.show = value;
      break;
    case "backgroundColor":
      //天空盒 背景色
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString(value);
      break;
    case "fog":
      //雾化 显隐
      viewer.scene.fog.enabled = value;
      if (value) {
        viewer.scene.fog.density = 1; // Default Value: 0.0006
      } else {
        viewer.scene.fog.density = 0;
      }
      break;
    case "verticalExaggeration":
      //地形夸张
      viewer.scene.verticalExaggeration = value;
      break;
    case "enableZoom":
      // 缩放地图
      viewer.scene.screenSpaceCameraController.enableZoom = value;
      break;
    case "enableTilt":
      // 倾斜相机(3D和2.5D)
      viewer.scene.screenSpaceCameraController.enableTilt = value;
      break;
    case "enableRotate":
      // 旋转转换位置(3D和2D)
      viewer.scene.screenSpaceCameraController.enableRotate = value;
      break;
    case "enableTranslate":
      // 平移地图(2D和2.5D)
      viewer.scene.screenSpaceCameraController.enableTranslate = value;
      break;
    case "constrainedAxis":
      // 南北极绕轴心旋转
      viewer.scene.camera.constrainedAxis = value
        ? Cesium.Cartesian3.UNIT_Z
        : undefined;
      break;
    case "enableCollisionDetection":
      // 是否进入地下  碰撞检测
      viewer.scene.enableCollisionDetection = value;
      break;
    case "minimumCollisionTerrainHeight":
      // 最小碰撞高度
      viewer.scene.screenSpaceCameraController.minimumCollisionTerrainHeight =
        value;
      break;
    case "minimumZoomDistance":
      // 相机最近视距
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = value;
      break;
    case "maximumZoomDistance":
      // 相机最远视距
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = value;
      break;
    case "zoomFactor":
      // 滚轮放大倍数
      viewer.scene.screenSpaceCameraController.zoomFactor = value;
      break;
    default:
      break;
  }
}

// 大气设置
export function changeSkyAtmosphere(key, value) {
  switch (key) {
    case "show":
      viewer.scene.skyAtmosphere.show = value;
      break;
    default:
      break;
  }
}

export function changeMouse(key, value) {
  switch (key) {
    case "":
      break;
    default:
      break;
  }
}

// globe + 大气 设置
export function changeGlobe(key, value) {
  switch (key) {
    case "enableLighting":
      // 昼夜区域
      viewer.scene.globe.enableLighting = value;
      break;
    case "depthTestAgainstTerrain":
      // 深度检测
      viewer.scene.globe.depthTestAgainstTerrain = value;
      break;
    case "baseLayer":
      // 显示/隐藏 底图
      const baseLayer = viewer.imageryLayers.get(0);
      baseLayer.show = value;
      break;
    case "baseColor":
      // 地球背景色
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString(value);
      break;
    case "showGroundAtmosphere":
      // 绘制地面大气
      viewer.scene.globe.showGroundAtmosphere = value;
      break;
    case "atmosphereLightIntensity":
      // 光照强度
      viewer.scene.globe.atmosphereLightIntensity = value;
      break;
    case "atmosphereHueShift":
      // 色相
      viewer.scene.globe.atmosphereHueShift = value;
      break;
    case "atmosphereSaturationShift":
      // 饱和度
      viewer.scene.globe.atmosphereSaturationShift = value;
      break;
    case "atmosphereBrightnessShift":
      // 亮度
      viewer.scene.globe.atmosphereBrightnessShift = value;
      break;
    case "atmosphereRayleighCoefficient-x":
      // 瑞利散射系数-红
      viewer.scene.globe.atmosphereRayleighCoefficient.x = value * 1e-6;
      break;
    case "atmosphereRayleighCoefficient-y":
      // 瑞利散射系数-绿
      viewer.scene.globe.atmosphereRayleighCoefficient.y = value * 1e-6;
      break;
    case "atmosphereRayleighCoefficient-z":
      // 瑞利散射系数-蓝
      viewer.scene.globe.atmosphereRayleighCoefficient.z = value * 1e-6;
      break;
    case "atmosphereRayleighScaleHeight":
      // 瑞利散射高度
      viewer.scene.globe.atmosphereRayleighScaleHeight = value;
      break;
    case "atmosphereMieCoefficient":
      // 米氏散射系数
      const v = value * 1e-6;
      viewer.scene.globe.atmosphereMieCoefficient = new Cesium.Cartesian3(
        v,
        v,
        v,
      );
      break;
    case "atmosphereMieScaleHeight":
      // 米氏散射高度
      viewer.scene.globe.atmosphereMieScaleHeight = value;
      break;
    case "atmosphereMieAnisotropy":
      // 米氏散射各向异性
      viewer.scene.globe.atmosphereMieAnisotropy = value;
      break;
    default:
      break;
  }
}
