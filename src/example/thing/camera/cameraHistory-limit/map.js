import CreateHalfDomeRangeLimit from "@class/CreateHalfDomeRangeLimit";
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

  // 调用示例
  // 创建半球罩（中心高度设为 0，底边刚好切地）
  const removeLimit = createHalfDomeRangeLimit(
    viewer,
    [116.391, 39.906, 0], // 中心点 [经, 纬, 高]
    200, // 2000 米半径
    {
      buffer: 300, // 超出 500 米飞回
      color: Cesium.Color.fromCssColorString("#00ffff"),
    },
  );
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}
