export let viewer;
let terrainCtrl;

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
  terrainCtrl = new TerrainController(viewer);
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

export function handleTerrain(val) {
  switch (val) {
    case "none":
      terrainCtrl.setNoTerrain();
      break;
    case "standard":
      terrainCtrl.setStandardTerrain();
      break;
    case "ioc":
      terrainCtrl.setIonTerrain();
      break;
    case "arcgis":
      terrainCtrl.setArcGisTerrain();
      break;
    default:
      break;
  }
}

export function handleOpen(v) {
  if (v) {
    terrainCtrl.toggleWireframe(true);
  } else {
    terrainCtrl.toggleWireframe(false);
  }
}

export class TerrainController {
  constructor(viewer) {
    this.viewer = viewer;
  }

  /**
   * 1. 切换为无地形（默认椭球体）
   */
  setNoTerrain() {
    this.viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
  }

  /**
   * 2. 切换为标准服务地形（Quantized-Mesh / TMS 格式）
   * @param {string} url - 地形服务地址
   */
  async setStandardTerrain(url = "http://data.mars3d.cn/terrain") {
    try {
      const provider = await Cesium.CesiumTerrainProvider.fromUrl(url, {
        requestVertexNormals: true, // 光照法线
        requestWaterMask: true, // 水面效果
      });
      this.viewer.terrainProvider = provider;
    } catch (error) {
      console.error("加载标准地形服务失败:", error);
    }
  }

  /**
   * 3. 切换为 Cesium Ion 在线地形 (Cesium World Terrain)
   * @param {number} assetId - Ion Asset ID，默认 1 为 WorldTerrain
   */
  async setIonTerrain(assetId = 1) {
    try {
      const provider = await Cesium.CesiumTerrainProvider.fromIonAssetId(
        assetId,
        {
          requestVertexNormals: true,
          requestWaterMask: true,
        },
      );
      this.viewer.terrainProvider = provider;
    } catch (error) {
      console.error("加载 Ion 地形失败:", error);
    }
  }

  /**
   * 4. 切换为 ArcGIS 高程服务地形
   * @param {string} url - ArcGIS ImageServer 服务地址
   */
  async setArcGisTerrain(
    url = "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
  ) {
    try {
      const provider = await Cesium.ArcGisMapServerTerrainProvider.fromUrl(
        url,
        {
          // token: 'YOUR_ARCGIS_TOKEN' // 如需鉴权可填写
        },
      );
      this.viewer.terrainProvider = provider;
    } catch (error) {
      console.error("加载 ArcGIS 地形失败:", error);
    }
  }

  /**
   * 5. 切换地形三角网显示 (Wireframe)
   * @param {boolean} [enable] - 不传参则在 true/false 间自动切换
   */
  toggleWireframe(enable) {
    const debug = viewer.scene.globe?._surface?.tileProvider?._debug;
    if (!debug) {
      console.warn("当前 Cesium 版本不支持地形线框调试");
      return;
    }
    debug.wireframe = enable;
    viewer.scene.requestRender();
  }
}
