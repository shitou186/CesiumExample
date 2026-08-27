/**
 * 基于点位创建半球网格罩（倒扣碗），超出范围 + buffer 后自动拉回
 * @param {Cesium.Viewer} viewer - Cesium Viewer 实例
 * @param {Array<number>} center - 中心点坐标 [经度, 纬度, 高度]
 * @param {number} radius - 限定半径（单位：米）
 * @param {Object} [options] - 配置项
 * @param {number} [options.buffer=200] - 允许超出的缓冲区距离（单位：米）
 * @param {Cesium.Color} [options.color=Cesium.Color.CYAN] - 网格线颜色
 * @param {number} [options.partitions=32] - 网格密度
 * @param {number} [options.duration=0.5] - 飞回动画时长（秒）
 * @returns {Function} destroy - 调用该函数移除半球网格并解除视角限制
 */
export default function CreateHalfDomeRangeLimit(
  viewer,
  center,
  radius,
  options = {},
) {
  const {
    buffer = 200,
    color = Cesium.Color.CYAN,
    partitions = 32,
    duration = 0.5,
  } = options;

  const centerCartesian = Cesium.Cartesian3.fromDegrees(
    center[0],
    center[1],
    center[2] || 0,
  );

  // 1. 创建半球（倒扣碗）网格罩
  const domeEntity = viewer.entities.add({
    position: centerCartesian,
    ellipsoid: {
      radii: new Cesium.Cartesian3(radius, radius, radius),
      fill: true,
      material: color.withAlpha(0.08),
      outline: true,
      outlineColor: color,
      outlineWidth: 2,
      stackPartitions: partitions / 2, // 半球减少纬线层数保持比例
      slicePartitions: partitions,
      // 核心设置：截取上半球（0度到90度）
      minimumCone: 0,
      maximumCone: Cesium.Math.PI_OVER_TWO,
    },
  });

  // 2. 视角控制器限制
  const controller = viewer.scene.screenSpaceCameraController;
  const prevMinZoom = controller.minimumZoomDistance;
  const prevMaxZoom = controller.maximumZoomDistance;

  controller.minimumZoomDistance = 100;
  controller.maximumZoomDistance = (radius + buffer) * 1.5;

  // 3. 超出（半径 + buffer）后自动飞回
  let isFlying = false;

  const onPreRender = () => {
    if (isFlying) return;

    const cameraPos = viewer.camera.position;
    if (!cameraPos) return;

    // 计算距离
    const currentDistance = Cesium.Cartesian3.distance(
      centerCartesian,
      cameraPos,
    );
    const triggerDistance = radius + buffer;

    if (currentDistance > triggerDistance) {
      isFlying = true;

      const direction = new Cesium.Cartesian3();
      Cesium.Cartesian3.subtract(cameraPos, centerCartesian, direction);
      Cesium.Cartesian3.normalize(direction, direction);

      const targetPos = new Cesium.Cartesian3();
      Cesium.Cartesian3.multiplyByScalar(direction, radius * 0.95, targetPos);
      Cesium.Cartesian3.add(centerCartesian, targetPos, targetPos);

      viewer.camera.flyTo({
        destination: targetPos,
        orientation: {
          heading: viewer.camera.heading,
          pitch: viewer.camera.pitch,
          roll: viewer.camera.roll,
        },
        duration: duration,
        complete: () => {
          isFlying = false;
        },
        cancel: () => {
          isFlying = false;
        },
      });
    }
  };

  viewer.scene.preRender.addEventListener(onPreRender);

  // 4. 返回销毁函数
  return function destroy() {
    viewer.scene.preRender.removeEventListener(onPreRender);
    viewer.entities.remove(domeEntity);
    controller.minimumZoomDistance = prevMinZoom;
    controller.maximumZoomDistance = prevMaxZoom;
  };
}
