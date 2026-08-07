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

export function exportImage() {
  exportCesiumSceneImage(viewer, {
    fileName: "三维场景.png",
    type: "image/png",
  });
}

/**
 * 导出 Cesium 当前场景截图
 *
 * @param {Cesium.Viewer} viewer
 * @param {object} options
 * @param {string} options.fileName 文件名
 * @param {"image/png"|"image/jpeg"|"image/webp"} options.type 图片格式
 * @param {number} options.quality JPEG/WebP 图片质量，范围 0~1
 */
export async function exportCesiumSceneImage(viewer, options = {}) {
  if (!viewer || viewer.isDestroyed()) {
    throw new Error("Cesium Viewer 不存在或已经销毁");
  }

  const {
    fileName = "cesium-scene.png",
    type = "image/png",
    quality = 1,
  } = options;

  const scene = viewer.scene;
  const canvas = scene.canvas;

  // 等待下一帧场景渲染完成
  await new Promise((resolve) => {
    const removeListener = scene.postRender.addEventListener(() => {
      removeListener();
      resolve();
    });

    scene.requestRender();
  });

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(
            new Error(
              "场景导出失败，请检查 preserveDrawingBuffer 和跨域资源配置",
            ),
          );
        }
      },
      type,
      quality,
    );
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  return blob;
}
