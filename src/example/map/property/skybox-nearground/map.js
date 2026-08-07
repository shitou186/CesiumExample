export let viewer;

export function onMounted() {
  viewer = new Cesium.Viewer("cesiumContainer", {
    // 抗锯齿
    fxaa: true,
    // 禁用时间轴
    // timeline: false,
    // 禁用底部时间控制器（动画播放控件）
    // animation: false,
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
        alpha: true,
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
    destination: Cesium.Cartesian3.fromDegrees(114.277645, 30.400638, 8450),
    orientation: {
      heading: Cesium.Math.toRadians(5.3), // 朝北（0 弧度）
      pitch: Cesium.Math.toRadians(-16), // 向下俯视 30 度
      roll: 0, // 不滚动
    },
    duration: 2,
  });
}

export function setScene(value = "none") {
  const scene = viewer.scene;
  switch (value) {
    case "qingtian":
      const qingtian = {
        positiveX: "./img/skybox-near/qingtian/rightav9.jpg",
        negativeX: "./img/skybox-near/qingtian/leftav9.jpg",
        positiveY: "./img/skybox-near/qingtian/frontav9.jpg",
        negativeY: "./img/skybox-near/qingtian/backav9.jpg",
        positiveZ: "./img/skybox-near/qingtian/topav9.jpg",
        negativeZ: "./img/skybox-near/qingtian/bottomav9.jpg",
      };
      cubeMapPanorama(qingtian);
      break;
    case "wanxia":
      const wanxia = {
        positiveX: "./img/skybox-near/wanxia/SunSetRight.png",
        negativeX: "./img/skybox-near/wanxia/SunSetLeft.png",
        positiveY: "./img/skybox-near/wanxia/SunSetFront.png",
        negativeY: "./img/skybox-near/wanxia/SunSetBack.png",
        positiveZ: "./img/skybox-near/wanxia/SunSetUp.png",
        negativeZ: "./img/skybox-near/wanxia/SunSetDown.png",
      };
      cubeMapPanorama(wanxia);
      break;
    case "lantian":
      const lantian = {
        positiveX: "./img/skybox-near/lantian/Right.jpg",
        negativeX: "./img/skybox-near/lantian/Left.jpg",
        positiveY: "./img/skybox-near/lantian/Front.jpg",
        negativeY: "./img/skybox-near/lantian/Back.jpg",
        positiveZ: "./img/skybox-near/lantian/Up.jpg",
        negativeZ: "./img/skybox-near/lantian/Down.jpg",
      };
      cubeMapPanorama(lantian);
      break;
    default:
      if (nearGroundSky) scene.primitives.remove(nearGroundSky);
      // 恢复 Cesium 默认地球星空
      if (!scene.skyBox) scene.skyBox = Cesium.SkyBox.createEarthSkyBox();
      // 恢复默认大气层
      if (scene.skyAtmosphere) {
        scene.skyAtmosphere.show = true;
      } else {
        scene.skyAtmosphere = new SkyAtmosphere(Ellipsoid.WGS84);
      }
      // 恢复太阳
      scene.sun = new Cesium.Sun();
      // 恢复月亮
      scene.moon = new Cesium.Moon();
      // 恢复默认黑色背景
      scene.backgroundColor = Cesium.Color.BLACK;
      break;
  }
}

let nearGroundSky;

export function cubeMapPanorama(sources) {
  const scene = viewer.scene;
  if (nearGroundSky) scene.primitives.remove(nearGroundSky);

  // 1. 隐藏 Cesium 默认星空
  if (scene.skyBox) {
    scene.skyBox.show = false;
  }

  // 2. 关闭默认大气层，避免和自定义天空叠加
  if (scene.skyAtmosphere) {
    scene.skyAtmosphere.show = false;
  }

  // 可选：隐藏太阳和月亮
  scene.sun.show = false;
  scene.moon.show = false;

  // 3. 设置当前三维场景的中心位置
  // 该坐标主要用于确定当地的“上、下、东、西、南、北”方向
  const centerPosition = Cesium.Cartesian3.fromDegrees(
    114.08354267477988, // 经度
    30.384656638019795, // 纬度
    100.0, // 高度
  );

  // 4. 创建当地局部坐标系

  const localFrameMatrix4 = Cesium.Transforms.eastNorthUpToFixedFrame(
    centerPosition,
    Cesium.Ellipsoid.WGS84,
    new Cesium.Matrix4(),
  );

  // CubeMapPanorama 的 transform 只需要旋转部分 Matrix3
  const localTransform = Cesium.Matrix4.getMatrix3(
    localFrameMatrix4,
    new Cesium.Matrix3(),
  );

  // 5. 添加近地立方体天空背景
  nearGroundSky = scene.primitives.add(
    new Cesium.CubeMapPanorama({
      sources,
      transform: localTransform,
      show: true,
    }),
  );

  scene.requestRender();
}
