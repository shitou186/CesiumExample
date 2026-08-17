import Tdt3dPlug from "tdt-terrain-cesium-plugin";

export let viewer;

// 依赖来源 https://app.unpkg.com/tdt-terrain-cesium-plugin@1.0.4

// 叠加地形服务
const terrainProvider = new Tdt3dPlug.GeoTerrainProvider({
  url: "https://t{s}.tianditu.gov.cn/mapservice/swdx?T=elv_c&x={x}&y={y}&l={z}&tk={token}",
  token: "75f0434f240669f4a2df6359275146d2",
  subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
});

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
    terrainProvider,
  });
  viewer.scene.globe.depthTestAgainstTerrain = true;
  flyTo();
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

/**
 * 切换地形三角网显示 (Wireframe)
 * @param {boolean} [enable] - 不传参则在 true/false 间自动切换
 */
export function toggleWireframe(enable) {
  const debug = viewer.scene.globe?._surface?.tileProvider?._debug;
  if (!debug) {
    console.warn("当前 Cesium 版本不支持地形线框调试");
    return;
  }
  debug.wireframe = enable;
  viewer.scene.requestRender();
}
