import OrbitFly from "@class/OrbitFly";
export let viewer;

export async function onMounted() {
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
        preserveDrawingBuffer: true,
      },
    },
  });
  flyTo();
}

export function flyTo() {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(112.722391, 26.774526, 755496),
    orientation: {
      heading: Cesium.Math.toRadians(0), // 朝北（0 弧度）
      pitch: Cesium.Math.toRadians(-90), // 向下俯视 30 度
      roll: 0, // 不滚动
    },
    complete: () => {
      // 1. 实例化控制器
      const orbitController = new OrbitFly(viewer);
      // 2. 启动环绕飞行
      orbitController.start({
        lng: 112.722391,
        lat: 26.774526,
        alt: 0,
        distance: 800, // 距离目标 800 米
        pitch: -20, // 视角俯仰 20 度
        speed: 0.2, // 旋转速度
      });
      // 停止环绕飞行
      // orbitController.stop()
    },
  });
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}
