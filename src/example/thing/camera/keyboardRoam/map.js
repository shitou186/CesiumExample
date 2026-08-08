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
      // 1. 实例化控制器
      const keyboardController = new KeyboardCameraController(viewer, {
        moveRate: 20.0, // 自定义平移速度（可选）
        rotateRate: 0.015, // 自定义旋转速度（可选）
        zoomRate: 30.0, // 自定义缩放速度（可选）
      });
      // 2. 开启键盘控制
      keyboardController.enable();

      // 如果需要在特定界面或模式下临时关闭控制：
      // keyboardController.disable();

      // 如果组件销毁或不再使用时：
      // keyboardController.destroy();
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
 * Cesium 键盘相机控制器封装类
 */
class KeyboardCameraController {
  /**
   * @param {Cesium.Viewer} viewer Cesium Viewer 实例
   * @param {Object} [options] 配置项
   * @param {number} [options.moveRate=10.0] 基础平移速度 (米/帧)
   * @param {number} [options.rotateRate=0.01] 基础旋转速度 (弧度/帧)
   * @param {number} [options.zoomRate=15.0] 基础缩放速度 (米/帧)
   * @param {boolean} [options.enableHeightScale=true] 是否开启根据相机高度动态缩放移动速度
   */
  constructor(viewer, options = {}) {
    if (!viewer) {
      throw new Error("KeyboardCameraController: viewer 是必填参数");
    }

    this.viewer = viewer;
    this.scene = viewer.scene;
    this.camera = viewer.camera;
    this.canvas = viewer.canvas;

    // 配置参数
    this.moveRate = options.moveRate || 10.0;
    this.rotateRate = options.rotateRate || 0.01;
    this.zoomRate = options.zoomRate || 15.0;
    this.enableHeightScale = options.enableHeightScale !== false;

    // 绑定状态
    this._enabled = false;
    this._removeTickListener = null;

    // 按键状态列表
    this.flags = {
      // 平移 (Q W E / A S D)
      moveUp: false,
      moveForward: false,
      moveDown: false,
      moveLeft: false,
      moveBackward: false,
      moveRight: false,
      // 绕中心点 (U I O / J K L)
      centerRotateUp: false,
      centerZoomIn: false,
      centerRotateDown: false,
      centerRotateCCW: false,
      centerZoomOut: false,
      centerRotateCW: false,
      // 视角自转 (方向键)
      lookUp: false,
      lookDown: false,
      lookLeft: false,
      lookRight: false,
    };

    // 预绑定事件处理函数，确保 removeEventListener 能正确解绑
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onTick = this._onTick.bind(this);

    // 初始化交互
    this._initCanvasFocus();
  }

  /**
   * 启用键盘控制
   */
  enable() {
    if (this._enabled) return;

    window.addEventListener("keydown", this._onKeyDown, false);
    window.addEventListener("keyup", this._onKeyUp, false);
    this.viewer.clock.onTick.addEventListener(this._onTick);

    this._enabled = true;
  }

  /**
   * 禁用键盘控制
   */
  disable() {
    if (!this._enabled) return;

    window.removeEventListener("keydown", this._onKeyDown, false);
    window.removeEventListener("keyup", this._onKeyUp, false);
    this.viewer.clock.onTick.removeEventListener(this._onTick);

    this._resetFlags();
    this._enabled = false;
  }

  /**
   * 销毁控制器
   */
  destroy() {
    this.disable();
    this.viewer = null;
    this.scene = null;
    this.camera = null;
    this.canvas = null;
  }

  // 设置 Canvas 可聚焦
  _initCanvasFocus() {
    this.canvas.setAttribute("tabindex", "0");
    this.canvas.addEventListener("click", () => {
      this.canvas.focus();
    });
  }

  // 重置按键状态
  _resetFlags() {
    for (let key in this.flags) {
      this.flags[key] = false;
    }
  }

  // 键盘按下处理
  _onKeyDown(e) {
    this._setFlag(e.code, true);
  }

  // 键盘抬起处理
  _onKeyUp(e) {
    this._setFlag(e.code, false);
  }

  // 映射按键
  _setFlag(code, value) {
    switch (code) {
      // 平移
      case "KeyQ":
        this.flags.moveUp = value;
        break;
      case "KeyW":
        this.flags.moveForward = value;
        break;
      case "KeyE":
        this.flags.moveDown = value;
        break;
      case "KeyA":
        this.flags.moveLeft = value;
        break;
      case "KeyS":
        this.flags.moveBackward = value;
        break;
      case "KeyD":
        this.flags.moveRight = value;
        break;

      // 绕屏幕中心点
      case "KeyU":
        this.flags.centerRotateUp = value;
        break;
      case "KeyI":
        this.flags.centerZoomIn = value;
        break;
      case "KeyO":
        this.flags.centerRotateDown = value;
        break;
      case "KeyJ":
        this.flags.centerRotateCCW = value;
        break;
      case "KeyK":
        this.flags.centerZoomOut = value;
        break;
      case "KeyL":
        this.flags.centerRotateCW = value;
        break;

      // 相机本身旋转
      case "ArrowUp":
        this.flags.lookUp = value;
        break;
      case "ArrowDown":
        this.flags.lookDown = value;
        break;
      case "ArrowLeft":
        this.flags.lookLeft = value;
        break;
      case "ArrowRight":
        this.flags.lookRight = value;
        break;
    }
  }

  // 获取当前屏幕中心点坐标
  _getScreenCenterCartesian() {
    const windowPosition = new Cesium.Cartesian2(
      this.canvas.clientWidth / 2,
      this.canvas.clientHeight / 2,
    );

    let ray = this.camera.getPickRay(windowPosition);
    let centerPoint = this.scene.pickPosition(windowPosition);

    if (!Cesium.defined(centerPoint)) {
      centerPoint = this.scene.globe.pick(ray, this.scene);
    }
    if (!Cesium.defined(centerPoint)) {
      centerPoint = this.camera.pickEllipsoid(windowPosition);
    }
    return centerPoint;
  }

  // 逐帧更新逻辑
  _onTick() {
    if (!this._enabled) return;

    let moveRate = this.moveRate;
    let zoomRate = this.zoomRate;

    // 根据相机高度自适应速率
    if (this.enableHeightScale && this.camera.positionCartographic) {
      const height = this.camera.positionCartographic.height;
      moveRate = Math.max(this.moveRate, height * 0.1);
      zoomRate = Math.max(this.zoomRate, height * 0.15);
    }

    const flags = this.flags;
    const camera = this.camera;

    // 1. 相机平移 (Q W E A S D)
    if (flags.moveForward) camera.moveForward(moveRate);
    if (flags.moveBackward) camera.moveBackward(moveRate);
    if (flags.moveLeft) camera.moveLeft(moveRate);
    if (flags.moveRight) camera.moveRight(moveRate);
    if (flags.moveUp) camera.moveUp(moveRate);
    if (flags.moveDown) camera.moveDown(moveRate);

    // 2. 相机本身视角旋转 (方向键)
    if (flags.lookUp) camera.lookUp(this.rotateRate);
    if (flags.lookDown) camera.lookDown(this.rotateRate);
    if (flags.lookLeft) camera.lookLeft(this.rotateRate);
    if (flags.lookRight) camera.lookRight(this.rotateRate);

    // 3. 绕屏幕中心点操作 (U I O J K L)
    if (flags.centerZoomIn) camera.zoomIn(zoomRate);
    if (flags.centerZoomOut) camera.zoomOut(zoomRate);

    if (
      flags.centerRotateUp ||
      flags.centerRotateDown ||
      flags.centerRotateCW ||
      flags.centerRotateCCW
    ) {
      const center = this._getScreenCenterCartesian();
      if (center) {
        if (flags.centerRotateUp) camera.rotate(camera.right, this.rotateRate);
        if (flags.centerRotateDown)
          camera.rotate(camera.right, -this.rotateRate);
        if (flags.centerRotateCW)
          camera.rotate(camera.direction, this.rotateRate);
        if (flags.centerRotateCCW)
          camera.rotate(camera.direction, -this.rotateRate);
      }
    }
  }
}
