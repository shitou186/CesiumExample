import { WebMapTileServiceImageryProvider } from "cesium"
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
  addLayer("img_w")
  addLayer("cia_w")
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

//地形加载
async function loadTerrain() {
  // console.log("加载地形");
  const url = "http://data.mars3d.cn/terrain";
  viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(url, {
    requestVertexNormals: true,
    requestWaterMask: true,
  });
}


function addLayer(type){
    const TDT_KEY = "fa514c882a3f5f6a942e09b7da010247"
    const layerType = [
    { label: "影像底图", value: "img_d", type: "img_w", layer: "img" },
    { label: "影像注记", value: "img_z", type: "cia_w", layer: "cia" },
    { label: "矢量底图", value: "vec_d", type: "vec_w", layer: "vec" },
    { label: "矢量注记", value: "vec_z", type: "cva_w", layer: "cva" },
    { label: "地形底图", value: "ter_d", type: "ter_w", layer: "ter" },
    { label: "地形注记", value: "ter_z", type: "cta_w", layer: "cta" },
  ];
  const find = layerType.find((t) => t.value === type);
  const v = find?.type!;
  const layer = find?.layer!;
  const tdtLayer = new WebMapTileServiceImageryProvider({
    url: `http://t{s}.tianditu.gov.cn/${v}/wmts?service=wmts&request=GetTile&version=1.0.0&layer=${layer}&tileMatrixSet=w&style=default&format=tiles&tk=${TDT_KEY}`,
    subdomains: ["1", "2", "3", "4", "5"],
    layer,
    style: "default",
    format: "image/jpeg",
    tileMatrixSetID: "w",
    maximumLevel: 18,
  });
  viewer.imageryLayers.addImageryProvider(wmts)
}