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
    contextOptions: {
      webgl: {
        preserveDrawingBuffer: true,
      },
    },
  });
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
    destination: Cesium.Cartesian3.fromDegrees(112.722391, 26.774526, 755496),
    orientation: {
      heading: Cesium.Math.toRadians(0), // 朝北（0 弧度）
      pitch: Cesium.Math.toRadians(-90), // 向下俯视 30 度
      roll: 0, // 不滚动
    },
    duration: 2,
  });
}

/**
 * 设置 Cesium 鼠标操作模式
 *
 * @param {number} type
 * 1 左键平移 + 中键旋转 + 右键缩放
 * 2 左键平移 + 中键缩放 + 右键旋转
 * 3 左键旋转 + 中键平移 + 右键缩放
 */
export function setMouseControlMode(type) {
  const LEFT = Cesium.CameraEventType.LEFT_DRAG;
  const MIDDLE = Cesium.CameraEventType.MIDDLE_DRAG;
  const RIGHT = Cesium.CameraEventType.RIGHT_DRAG;
  const WHEEL = Cesium.CameraEventType.WHEEL;
  const PINCH = Cesium.CameraEventType.PINCH;
  const controller = viewer.scene.screenSpaceCameraController;

  resetMouseControls();

  switch (type) {
    // 1.
    // 左键平移
    // 中键旋转
    // 右键缩放
    case 1:
      controller.rotateEventTypes = LEFT;
      controller.translateEventTypes = LEFT;

      controller.tiltEventTypes = MIDDLE;

      controller.zoomEventTypes = [RIGHT, WHEEL, PINCH];
      break;

    // 2.
    // 左键平移
    // 中键缩放
    // 右键旋转
    case 2:
      controller.rotateEventTypes = LEFT;
      controller.translateEventTypes = LEFT;

      controller.tiltEventTypes = RIGHT;

      controller.zoomEventTypes = [MIDDLE, WHEEL, PINCH];
      break;

    // 3.
    // 左键旋转
    // 中键平移
    // 右键缩放
    case 3:
      controller.rotateEventTypes = MIDDLE;
      controller.translateEventTypes = MIDDLE;

      controller.tiltEventTypes = LEFT;

      controller.zoomEventTypes = [RIGHT, WHEEL, PINCH];
      break;

    default:
      console.warn("未知鼠标操作模式:", type);
  }

  viewer.scene.requestRender();
}

/**
 * 清除当前所有鼠标操作映射
 */
function resetMouseControls() {
  const controller = viewer.scene.screenSpaceCameraController;

  controller.rotateEventTypes = undefined;
  controller.translateEventTypes = undefined;
  controller.zoomEventTypes = undefined;
  controller.tiltEventTypes = undefined;
  controller.lookEventTypes = undefined;

  // 确保功能本身没有被关闭
  controller.enableInputs = true;
  controller.enableRotate = true;
  controller.enableTranslate = true;
  controller.enableZoom = true;
  controller.enableTilt = true;
  controller.enableLook = true;
}
