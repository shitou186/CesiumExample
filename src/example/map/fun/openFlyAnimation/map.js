export let viewer;

let totalAngle = 0; // 记录已旋转的总弧度
const rotateSpeed = Cesium.Math.toRadians(0.8); // 每帧旋转角度（可调整速度）
const targetAngle = Math.PI * 2; // 360度 (2π 弧度)

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

  // 2. 设置初始太空视角
  const initialPosition = Cesium.Cartesian3.fromDegrees(
    116.3974,
    39.9093,
    20000000,
  ); // 空间高度
  viewer.camera.setView({
    destination: initialPosition,
    orientation: {
      heading: Cesium.Math.toRadians(0.0),
      pitch: Cesium.Math.toRadians(-90.0), // 垂直俯视地球
      roll: 0.0,
    },
  });

  // 3. 配置自转动画参数

  // 绑定到时钟每帧更新事件
  viewer.clock.onTick.addEventListener(onGlobeRotate);
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}

// 旋转逻辑与定位触发
function onGlobeRotate() {
  if (totalAngle < targetAngle) {
    // 绕地球 Z 轴（自转轴）旋转相机
    viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, -rotateSpeed);
    totalAngle += rotateSpeed;
  } else {
    // 旋转满一圈后，移除事件监听
    viewer.clock.onTick.removeEventListener(onGlobeRotate);

    // 飞向目标点
    flyTo();
  }
}

export function flyTo() {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.189802, 30.145883, 121583.4), 
    orientation: {
      heading: Cesium.Math.toRadians(0), // 朝北（0 弧度）
      pitch: Cesium.Math.toRadians(-90), // 向下俯视 30 度
      roll: 0, // 不滚动
    },
    duration: 2,
    complete: function () {
      viewer.camera.cancelFlight();
      viewer.camera.flyTo({
        destination: viewer.camera.position,
        orientation: {
          heading: Cesium.Math.toRadians(0), // 朝北（0 弧度）
          pitch: Cesium.Math.toRadians(-75), // 向下俯视 30 度
          roll: 0, // 不滚动
        },
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT, // 缓动效果
      });
    },
  });
}
