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
      rotateCamera();
    },
  });
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}

function rotateCamera() {
  const targetPosition = Cesium.Cartesian3.fromDegrees(112.722391, 26.774526, 722); // 目标点坐标
  let heading = 0; // 初始偏航角
  const distance = 500; // 相机距离目标点的距离（米）
  const pitch = -6; // 视角俯仰角（-6度俯视）

  // 在渲染循环中逐帧更新相机 heading 角
  viewer.scene.postRender.addEventListener(() => {
    heading += 0.5; // 旋转速度（单位：度）
    if (heading >= 360) heading -= 360;

    viewer.camera.lookAt(
      targetPosition,
      new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(heading),
        Cesium.Math.toRadians(pitch),
        distance,
      ),
    );
  });

  // 如需停止绕点旋转并解锁相机控制：
  // viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
}
