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
    destination: Cesium.Cartesian3.fromDegrees(
      -95.166493,
      39.9060534,
      20000000,
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0), // 朝北（0 弧度）
      pitch: Cesium.Math.toRadians(-90), // 向下俯视 30 度
      roll: 0, // 不滚动
    },
    duration: 2,
  });
}

export function setScene(value = "none") {
  const scene = viewer.scene;
  switch (value) {
    case "color":
      // 移除星空背景
      scene.skyBox = undefined;
      // 关闭大气层效果
      if (scene.skyAtmosphere) {
        scene.skyAtmosphere.show = false;
      }
      scene.backgroundColor = Cesium.Color.fromCssColorString("#18a385");
      // 可选：隐藏太阳和月亮
      scene.sun.show = false;
      scene.moon.show = false;
      break;
    case "image":
      viewer.container.style.backgroundImage =
        'url("/img/busines/background2.jpg")';

      viewer.container.style.backgroundSize = "cover";
      viewer.container.style.backgroundPosition = "center";
      viewer.container.style.backgroundRepeat = "no-repeat";
      viewer.container.style.backgroundColor = "#071426";
      if (scene.skyBox) {
        scene.skyBox.show = false;
      }
      if (scene.skyAtmosphere) {
        scene.skyAtmosphere.show = false;
      }
      if (scene.sun) {
        scene.sun.show = false;
      }
      if (scene.moon) {
        scene.moon.show = false;
      }
      scene.backgroundColor = Cesium.Color.TRANSPARENT;
      scene.requestRender();
      break;
    case "box":
      scene.skyBox = new Cesium.SkyBox({
        sources: {
          positiveX: "./img/skybox-milkyway/tycho2t3_80_px.jpg",
          negativeX: "./img/skybox-milkyway/tycho2t3_80_mx.jpg",
          positiveY: "./img/skybox-milkyway/tycho2t3_80_py.jpg",
          negativeY: "./img/skybox-milkyway/tycho2t3_80_my.jpg",
          positiveZ: "./img/skybox-milkyway/tycho2t3_80_pz.jpg",
          negativeZ: "./img/skybox-milkyway/tycho2t3_80_mz.jpg",
        },
      });
      // 关闭大气层效果
      if (scene.skyAtmosphere) {
        scene.skyAtmosphere.show = false;
      }
      // 可选：隐藏太阳和月亮
      scene.sun.show = false;
      scene.moon.show = false;
      scene.requestRender();
      break;
    default:
      // 恢复 Cesium 默认地球星空
      scene.skyBox = Cesium.SkyBox.createEarthSkyBox();
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
