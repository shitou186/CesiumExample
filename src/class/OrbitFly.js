/**
 * Cesium 绕点飞行控制器
 */
export default class OrbitFly {
  constructor(viewer) {
    this.viewer = viewer;
    this.isOrbiting = false;
    this.removeTickListener = null;
  }

  /**
   * 开始绕点飞行
   * @param {Object} options
   * @param {number} options.lng - 中心点经度
   * @param {number} options.lat - 中心点纬度
   * @param {number} [options.alt=0] - 中心点高度（米）
   * @param {number} [options.distance=1000] - 相机距离目标的距离（米）
   * @param {number} [options.pitch=-25] - 俯仰角（度，负数向下看）
   * @param {number} [options.speed=0.15] - 旋转速度（度/帧）
   */
  start(options) {
    this.stop(); // 启动前重置之前可能存在的动画

    const {
      lng,
      lat,
      alt = 0,
      distance = 1000,
      pitch = -25,
      speed = 0.15,
    } = options;

    const center = Cesium.Cartesian3.fromDegrees(lng, lat, alt);
    let heading = 0;

    this.isOrbiting = true;

    // 逐帧更新相机视角
    const onTickCallback = () => {
      if (!this.isOrbiting) return;

      heading = (heading + speed) % 360;

      // 将相机锁定并聚焦在中心点，并应用当前的 heading/pitch/distance
      this.viewer.camera.lookAt(
        center,
        new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(heading),
          Cesium.Math.toRadians(pitch),
          distance,
        ),
      );
    };

    // 绑定时钟更新事件
    this.viewer.clock.onTick.addEventListener(onTickCallback);

    // 记录解绑句柄
    this.removeTickListener = () => {
      this.viewer.clock.onTick.removeEventListener(onTickCallback);
    };
  }

  /**
   * 停止绕点飞行并解锁相机自由操作
   */
  stop() {
    if (!this.isOrbiting) return;

    if (this.removeTickListener) {
      this.removeTickListener();
      this.removeTickListener = null;
    }

    // 核心：解除相机与目标点的绑定，恢复鼠标交互控制
    this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    this.isOrbiting = false;
  }
}
