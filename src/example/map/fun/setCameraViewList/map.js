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
  await add3dtiles();

  // ================= 使用示例 =================
  const viewPoints = [
    {
      lng: 108.961601,
      lat: 34.217109,
      alt: 509.2,
      heading: 314.5,
      pitch: -22.5,
      duration: 6,
      stop: 2,
    },
    {
      lng: 108.96164,
      lat: 34.222159,
      alt: 510.3,
      heading: 211.2,
      pitch: -22.5,
      duration: 8,
      stop: 0,
    },
    {
      lng: 108.957259,
      lat: 34.221967,
      alt: 494.3,
      heading: 127.5,
      pitch: -17.2,
      duration: 8,
      stop: 1,
    },
    {
      lng: 108.957319,
      lat: 34.217225,
      alt: 515.5,
      heading: 25.4,
      pitch: -25.3,
      duration: 8,
      stop: 0,
    },
  ];

  // 调用飞行漫游
  flyToViewPoints(viewer, viewPoints);
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}

async function add3dtiles() {
  const url = "https://data.mars3d.cn/3dtiles/qx-dyt/tileset.json";
  const tileset = await Cesium.Cesium3DTileset.fromUrl(url);
  // 将 tileset 添加到场景中
  viewer.scene.primitives.add(tileset);
  // 飞行到 3D Tiles 位置
  await viewer.flyTo(tileset, {
    duration: 2, // 飞行时间（秒）
    offset: new Cesium.HeadingPitchRange(
      0, // 航向角
      Cesium.Math.toRadians(-27), // 俯仰角（向下看）
      tileset.boundingSphere.radius * 2, // 相机距离
    ),
  });
}

/**
 * 执行视点漫游飞行
 * @param {Cesium.Viewer} viewer - Cesium Viewer 实例
 * @param {Array} points - 视点数组
 */
async function flyToViewPoints(viewer, points) {
  if (!viewer || !points || points.length === 0) return;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];

    // 1. 飞行至当前视点
    await new Promise((resolve) => {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(pt.lng, pt.lat, pt.alt),
        orientation: {
          heading: Cesium.Math.toRadians(pt.heading || 0),
          pitch: Cesium.Math.toRadians(pt.pitch || 0),
          roll: Cesium.Math.toRadians(pt.roll || 0),
        },
        duration: pt.duration || 3, // 默认飞行 3 秒
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
        complete: resolve, // 飞行完成后触发 resolve 阶段
        cancel: resolve, // 若用户打断飞行，也退出等待
      });
    });

    // 2. 处理视点停留（stop 参数，单位：秒）
    if (pt.stop && pt.stop > 0) {
      await new Promise((resolve) => setTimeout(resolve, pt.stop * 1000));
    }
  }
}
