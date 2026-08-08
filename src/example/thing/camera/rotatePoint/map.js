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
    destination: Cesium.Cartesian3.fromDegrees(112.722391, 26.774526, 755496),
    orientation: {
      heading: Cesium.Math.toRadians(0), // 朝北（0 弧度）
      pitch: Cesium.Math.toRadians(-90), // 向下俯视 30 度
      roll: 0, // 不滚动
    },
    complete: () => {
      // 1. 实例化控制器
      const orbitController = new OrbitFly(viewer);
      // 2. 启动围绕大雁塔的环绕飞行
      orbitController.start({
        lng: 108.961601,
        lat: 34.217109,
        alt: 0,
        distance: 800, // 距离目标 800 米
        pitch: -20, // 视角俯仰 20 度
        speed: 0.2, // 旋转速度
      });
      // 停止环绕飞行
      // orbitController.stop()
    },
  });
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}

/**
 * Cesium 绕点飞行控制器
 */
class OrbitFly {
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
