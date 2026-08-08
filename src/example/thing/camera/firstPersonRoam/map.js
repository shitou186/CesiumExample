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
      // 2. 实例化漫游控制器
      const roamer = new FirstPersonRoam(viewer, {
        moveSpeed: 3.0, // 移动速度（米/帧）
        eyeHeight: 1.7, // 视角高度（米）
        sensitivity: 0.0025, // 鼠标晃动灵敏度
      });

      // 3. 启动漫游模式
      roamer.activate();
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
 * Cesium 第一人称贴地漫游控制器
 */
class FirstPersonRoam {
  /**
   * @param {Cesium.Viewer} viewer Cesium Viewer 实例
   * @param {Object} [options] 配置参数
   * @param {number} [options.moveSpeed=5.0] 移动速度 (米/帧)
   * @param {number} [options.eyeHeight=1.8] 人眼视角高度 (米)
   * @param {number} [options.sensitivity=0.002] 鼠标视角灵敏度
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.scene = viewer.scene;
    this.camera = viewer.camera;

    // 配置参数
    this.moveSpeed = options.moveSpeed || 5.0;
    this.eyeHeight = options.eyeHeight || 1.8;
    this.sensitivity = options.sensitivity || 0.002;

    this.isActivated = false;
    this.moveState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };

    // 缓存默认相机控制器状态
    this._savedControllerState = null;

    // 绑定上下文
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onCanvasClick = this._onCanvasClick.bind(this);
    this._onPostRender = this._onPostRender.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);
  }

  /**
   * 开启漫游
   */
  activate() {
    if (this.isActivated) return;
    this.isActivated = true;

    // 开启深度测试，保证贴地计算准确
    this.scene.globe.depthTestAgainstTerrain = true;

    // 1. 禁用 Cesium 原生的相机交互，防止冲突
    const controller = this.scene.screenSpaceCameraController;
    this._savedControllerState = {
      enableRotate: controller.enableRotate,
      enableTranslate: controller.enableTranslate,
      enableZoom: controller.enableZoom,
      enableTilt: controller.enableTilt,
      enableLook: controller.enableLook,
    };
    controller.enableRotate = false;
    controller.enableTranslate = false;
    controller.enableZoom = false;
    controller.enableTilt = false;
    controller.enableLook = false;

    // 2. 绑定 DOM 与 帧渲染事件
    const canvas = this.viewer.canvas;
    canvas.setAttribute("tabindex", "0");

    canvas.addEventListener("click", this._onCanvasClick);
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    document.addEventListener("mousemove", this._onMouseMove);
    document.addEventListener("pointerlockchange", this._onPointerLockChange);

    this.scene.postRender.addEventListener(this._onPostRender);
    console.log(
      "第一人称漫游模式已启用。单击地图即可锁定鼠标并开启漫游（按 Esc 退出锁定）。",
    );
  }

  /**
   * 关闭漫游并恢复默认控制
   */
  deactivate() {
    if (!this.isActivated) return;
    this.isActivated = false;

    // 退出指针锁定
    if (document.pointerLockElement === this.viewer.canvas) {
      document.exitPointerLock();
    }

    // 恢复相机默认交互
    if (this._savedControllerState) {
      const controller = this.scene.screenSpaceCameraController;
      Object.assign(controller, this._savedControllerState);
    }

    // 解绑事件
    const canvas = this.viewer.canvas;
    canvas.removeEventListener("click", this._onCanvasClick);
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    document.removeEventListener("mousemove", this._onMouseMove);
    document.removeEventListener(
      "pointerlockchange",
      this._onPointerLockChange,
    );

    this.scene.postRender.removeEventListener(this._onPostRender);

    // 重置按键状态
    this.moveState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };
    console.log("第一人称漫游模式已关闭。");
  }

  /**
   * 单击 Canvas 请求指针锁定
   */
  _onCanvasClick() {
    const canvas = this.viewer.canvas;
    canvas.focus();
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
    }
  }

  _onPointerLockChange() {
    // 如果用户按 Esc 退出指针锁定，重置移动状态
    if (document.pointerLockElement !== this.viewer.canvas) {
      this.moveState = {
        forward: false,
        backward: false,
        left: false,
        right: false,
      };
    }
  }

  _onKeyDown(e) {
    if (document.pointerLockElement !== this.viewer.canvas) return;
    this._updateMoveState(e.code, true);
  }

  _onKeyUp(e) {
    if (document.pointerLockElement !== this.viewer.canvas) return;
    this._updateMoveState(e.code, false);
  }

  _updateMoveState(code, isPressed) {
    switch (code) {
      case "KeyW":
        this.moveState.forward = isPressed;
        break;
      case "KeyS":
        this.moveState.backward = isPressed;
        break;
      case "KeyA":
        this.moveState.left = isPressed;
        break;
      case "KeyD":
        this.moveState.right = isPressed;
        break;
    }
  }

  /**
   * 处理鼠标视角旋转（Pitch / Yaw）
   */
  _onMouseMove(e) {
    if (document.pointerLockElement !== this.viewer.canvas) return;

    const deltaX = e.movementX || 0;
    const deltaY = e.movementY || 0;

    if (deltaX === 0 && deltaY === 0) return;

    // 1. 左右旋转 (Yaw) - 围绕地表法线 (Local UP)
    const localUp = this.scene.globe.ellipsoid.geodeticSurfaceNormal(
      this.camera.position,
    );
    this.camera.look(localUp, deltaX * this.sensitivity);

    // 2. 上下俯仰 (Pitch) - 限制在 -85° 到 85° 之间，防止镜头翻转
    const currentPitch = this.camera.pitch;
    const pitchDelta = deltaY * this.sensitivity;
    const targetPitch = currentPitch - pitchDelta;

    const maxPitch = Cesium.Math.toRadians(85);
    const minPitch = Cesium.Math.toRadians(-85);

    if (targetPitch > minPitch && targetPitch < maxPitch) {
      this.camera.look(this.camera.right, pitchDelta);
    }
  }

  /**
   * 帧循环更新位置及贴地高度
   */
  _onPostRender() {
    if (document.pointerLockElement !== this.viewer.canvas) return;

    const { forward, backward, left, right } = this.moveState;
    if (!forward && !backward && !left && !right) return;

    const camera = this.camera;
    const localUp = this.scene.globe.ellipsoid.geodeticSurfaceNormal(
      camera.position,
    );

    // 获取前向与右向在水平面上的投影（抹平俯仰角对移动的影响）
    const forwardHoriz = Cesium.Cartesian3.subtract(
      camera.direction,
      Cesium.Cartesian3.multiplyByScalar(
        localUp,
        Cesium.Cartesian3.dot(camera.direction, localUp),
        new Cesium.Cartesian3(),
      ),
      new Cesium.Cartesian3(),
    );
    Cesium.Cartesian3.normalize(forwardHoriz, forwardHoriz);

    const rightHoriz = Cesium.Cartesian3.subtract(
      camera.right,
      Cesium.Cartesian3.multiplyByScalar(
        localUp,
        Cesium.Cartesian3.dot(camera.right, localUp),
        new Cesium.Cartesian3(),
      ),
      new Cesium.Cartesian3(),
    );
    Cesium.Cartesian3.normalize(rightHoriz, rightHoriz);

    // 计算合成位移向量
    const moveVector = new Cesium.Cartesian3();
    if (forward) Cesium.Cartesian3.add(moveVector, forwardHoriz, moveVector);
    if (backward)
      Cesium.Cartesian3.subtract(moveVector, forwardHoriz, moveVector);
    if (right) Cesium.Cartesian3.add(moveVector, rightHoriz, moveVector);
    if (left) Cesium.Cartesian3.subtract(moveVector, rightHoriz, moveVector);

    if (Cesium.Cartesian3.magnitudeSquared(moveVector) > 0) {
      Cesium.Cartesian3.normalize(moveVector, moveVector);
      Cesium.Cartesian3.multiplyByScalar(
        moveVector,
        this.moveSpeed,
        moveVector,
      );

      const newPosition = Cesium.Cartesian3.add(
        camera.position,
        moveVector,
        new Cesium.Cartesian3(),
      );

      // 采样地形或 3D Tiles 真实高度实现贴地
      const cartographic = Cesium.Cartographic.fromCartesian(newPosition);
      const terrainHeight = this.scene.sampleHeight(cartographic);

      if (Cesium.defined(terrainHeight)) {
        cartographic.height = terrainHeight + this.eyeHeight;
        camera.position = Cesium.Cartesian3.fromRadians(
          cartographic.longitude,
          cartographic.latitude,
          cartographic.height,
        );
      } else {
        camera.position = newPosition;
      }
    }
  }

  /**
   * 销毁实例并释放资源
   */
  destroy() {
    this.deactivate();
    this.viewer = null;
    this.scene = null;
    this.camera = null;
  }
}
