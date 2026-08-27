import KeyboardCameraController from "@class/KeyboardCameraController";
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
    destination: Cesium.Cartesian3.fromDegrees(112.722391, 26.774526, 722),
    orientation: {
      heading: Cesium.Math.toRadians(87), // 朝北（0 弧度）
      pitch: Cesium.Math.toRadians(-6), // 向下俯视 30 度
      roll: 0, // 不滚动
    },
    complete: () => {
      // 1. 实例化控制器
      const keyboardController = new KeyboardCameraController(viewer, {
        moveRate: 20.0, // 自定义平移速度（可选）
        rotateRate: 0.015, // 自定义旋转速度（可选）
        zoomRate: 30.0, // 自定义缩放速度（可选）
      });
      // 2. 开启键盘控制
      keyboardController.enable();

      // 如果需要在特定界面或模式下临时关闭控制：
      // keyboardController.disable();

      // 如果组件销毁或不再使用时：
      // keyboardController.destroy();
    },
  });
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}
