export let viewer;

const SKYBOX_SOURCES = {
  qingtian: {
    positiveX: "./img/skybox-near/qingtian/rightav9.jpg",
    negativeX: "./img/skybox-near/qingtian/leftav9.jpg",
    positiveY: "./img/skybox-near/qingtian/frontav9.jpg",
    negativeY: "./img/skybox-near/qingtian/backav9.jpg",
    positiveZ: "./img/skybox-near/qingtian/topav9.jpg",
    negativeZ: "./img/skybox-near/qingtian/bottomav9.jpg",
  },
  wanxia: {
    positiveX: "./img/skybox-near/wanxia/SunSetRight.png",
    negativeX: "./img/skybox-near/wanxia/SunSetLeft.png",
    positiveY: "./img/skybox-near/wanxia/SunSetFront.png",
    negativeY: "./img/skybox-near/wanxia/SunSetBack.png",
    positiveZ: "./img/skybox-near/wanxia/SunSetUp.png",
    negativeZ: "./img/skybox-near/wanxia/SunSetDown.png",
  },
  night: {
    positiveX: "./img/skybox-milkyway/tycho2t3_80_px.jpg",
    negativeX: "./img/skybox-milkyway/tycho2t3_80_mx.jpg",
    positiveY: "./img/skybox-milkyway/tycho2t3_80_py.jpg",
    negativeY: "./img/skybox-milkyway/tycho2t3_80_my.jpg",
    positiveZ: "./img/skybox-milkyway/tycho2t3_80_pz.jpg",
    negativeZ: "./img/skybox-milkyway/tycho2t3_80_mz.jpg",
  },
};

const vertexShaderSource = `
uniform mat3 u_cubeMapPanoramaTransform;
in vec3 position;
out vec3 v_texCoord;

void main()
{
  vec3 p = czm_viewRotation *
    (u_cubeMapPanoramaTransform * (czm_entireFrustum.y * position));
  gl_Position = czm_projection * vec4(p, 1.0);
  v_texCoord = position;
}
`;

const fragmentShaderSource = `
uniform samplerCube u_qingtianCubeMap;
uniform samplerCube u_wanxiaCubeMap;
uniform samplerCube u_nightCubeMap;
uniform float u_transition;
in vec3 v_texCoord;

void main()
{
  vec3 direction = normalize(v_texCoord);
  vec3 qingtian = czm_gammaCorrect(
    czm_textureCube(u_qingtianCubeMap, direction)
  ).rgb;
  vec3 wanxia = czm_gammaCorrect(
    czm_textureCube(u_wanxiaCubeMap, direction)
  ).rgb;
  vec3 night = czm_gammaCorrect(
    czm_textureCube(u_nightCubeMap, direction)
  ).rgb;

  float qingtianToWanxia = smoothstep(0.0, 1.0, u_transition);
  float wanxiaToNight = smoothstep(1.0, 2.0, u_transition);
  vec3 dayColor = mix(qingtian, wanxia, qingtianToWanxia);
  vec3 color = mix(dayColor, night, wanxiaToNight);
  out_FragColor = vec4(color, 1.0);
}
`;

class MultipleCubeMapPanorama {
  constructor(options) {
    this.show = options.show ?? true;
    this.transform = options.transform;
    this._context = options.context;
    this._transition = Cesium.Math.clamp(Number(options.value) || 0, 0, 2);
    this._cubeMaps = undefined;
    this._command = undefined;
    this._attributeLocations = undefined;
    this._useHdr = undefined;
    this._destroyed = false;

    this.readyPromise = this._loadCubeMaps(options.sources);
  }

  get value() {
    return this._transition;
  }

  set value(value) {
    const number = Number(value);
    this._transition = Cesium.Math.clamp(
      Number.isFinite(number) ? number : 0,
      0,
      2,
    );
  }

  async _loadCubeMaps(sources) {
    const cubeMaps = await Promise.all([
      Cesium.loadCubeMap(this._context, sources.qingtian),
      Cesium.loadCubeMap(this._context, sources.wanxia),
      Cesium.loadCubeMap(this._context, sources.night),
    ]);

    if (this._destroyed) {
      cubeMaps.forEach((cubeMap) => cubeMap.destroy());
      return false;
    }

    this._cubeMaps = {
      qingtian: cubeMaps[0],
      wanxia: cubeMaps[1],
      night: cubeMaps[2],
    };
    return true;
  }

  _createCommand(frameState) {
    const geometry = Cesium.BoxGeometry.createGeometry(
      Cesium.BoxGeometry.fromDimensions({
        dimensions: new Cesium.Cartesian3(2, 2, 2),
        vertexFormat: Cesium.VertexFormat.POSITION_ONLY,
      }),
    );
    this._attributeLocations =
      Cesium.GeometryPipeline.createAttributeLocations(geometry);

    const vertexArray = Cesium.VertexArray.fromGeometry({
      context: frameState.context,
      geometry,
      attributeLocations: this._attributeLocations,
      bufferUsage: Cesium.BufferUsage.STATIC_DRAW,
    });

    this._command = new Cesium.DrawCommand({
      owner: this,
      vertexArray,
      renderState: Cesium.RenderState.fromCache({
        depthTest: { enabled: false },
        depthMask: false,
      }),
      uniformMap: {
        u_cubeMapPanoramaTransform: () => this.transform,
        u_qingtianCubeMap: () => this._cubeMaps.qingtian,
        u_wanxiaCubeMap: () => this._cubeMaps.wanxia,
        u_nightCubeMap: () => this._cubeMaps.night,
        u_transition: () => this._transition,
      },
      pass: Cesium.Pass.ENVIRONMENT,
    });
  }

  _updateShader(frameState, useHdr) {
    if (this._command.shaderProgram && this._useHdr === useHdr) return;

    this._command.shaderProgram?.destroy();
    this._command.shaderProgram = Cesium.ShaderProgram.fromCache({
      context: frameState.context,
      vertexShaderSource,
      fragmentShaderSource: new Cesium.ShaderSource({
        defines: useHdr ? ["HDR"] : [],
        sources: [fragmentShaderSource],
      }),
      attributeLocations: this._attributeLocations,
    });
    this._useHdr = useHdr;
  }

  update(frameState, useHdr = false) {
    if (
      this._destroyed ||
      !this.show ||
      !this._cubeMaps ||
      !frameState.passes.render ||
      (frameState.mode !== Cesium.SceneMode.SCENE3D &&
        frameState.mode !== Cesium.SceneMode.MORPHING)
    ) {
      return;
    }

    if (!this._command) this._createCommand(frameState);
    this._updateShader(frameState, useHdr);

    if (!frameState.panoramaCommandList.includes(this._command)) {
      frameState.panoramaCommandList.push(this._command);
    }
  }

  isDestroyed() {
    return this._destroyed;
  }

  destroy() {
    if (this._destroyed) return undefined;

    this._command?.vertexArray?.destroy();
    this._command?.shaderProgram?.destroy();
    if (this._cubeMaps) {
      Object.values(this._cubeMaps).forEach((cubeMap) => cubeMap.destroy());
    }

    this._command = undefined;
    this._cubeMaps = undefined;
    this._destroyed = true;
    return undefined;
  }
}

let nearGroundSky;
let transitionValue = 0;
let sliderSyncFrame;

function syncTransitionSlider() {
  const sliders = window.parent.document.querySelectorAll(".el-slider [role=slider]");
  const slider = Array.from(sliders).find(
    (item) =>
      Number(item.getAttribute("aria-valuemin")) === 0 &&
      Number(item.getAttribute("aria-valuemax")) === 2,
  );

  if (slider) {
    const value = Number(slider.getAttribute("aria-valuenow"));
    if (Number.isFinite(value) && value !== transitionValue) setScene(value);
  }

  sliderSyncFrame = requestAnimationFrame(syncTransitionSlider);
}

export function onMounted() {
  viewer = new Cesium.Viewer("cesiumContainer", {
    fxaa: true,
    fullscreenButton: false,
    vrButton: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    baseLayerPicker: false,
    navigationHelpButton: false,
    infoBox: false,
    attribution: false,
    contextOptions: {
      webgl: { alpha: true },
    },
  });

  flyTo();
  cubeMapPanorama();
  syncTransitionSlider();
}

export function onUnmounted() {
  if (sliderSyncFrame) cancelAnimationFrame(sliderSyncFrame);
  sliderSyncFrame = undefined;
  nearGroundSky = undefined;
  if (viewer && !viewer.isDestroyed()) viewer.destroy();
  viewer = undefined;
}

export function flyTo() {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.277645, 30.400638, 8450),
    orientation: {
      heading: Cesium.Math.toRadians(5.3),
      pitch: Cesium.Math.toRadians(-16),
      roll: 0,
    },
    duration: 2,
  });
}

function createLocalTransform() {
  const center = Cesium.Cartesian3.fromDegrees(
    114.08354267477988,
    30.384656638019795,
    100,
  );
  const localFrame = Cesium.Transforms.eastNorthUpToFixedFrame(
    center,
    Cesium.Ellipsoid.WGS84,
    new Cesium.Matrix4(),
  );
  return Cesium.Matrix4.getMatrix3(localFrame, new Cesium.Matrix3());
}

function hideDefaultSky() {
  const scene = viewer.scene;
  if (scene.skyBox) scene.skyBox.show = false;
  if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;
  if (scene.sun) scene.sun.show = false;
  if (scene.moon) scene.moon.show = false;
}

export function cubeMapPanorama() {
  const scene = viewer.scene;
  if (nearGroundSky) scene.primitives.remove(nearGroundSky);
  hideDefaultSky();

  nearGroundSky = scene.primitives.add(
    new MultipleCubeMapPanorama({
      context: scene.context,
      sources: SKYBOX_SOURCES,
      transform: createLocalTransform(),
      value: transitionValue,
    }),
  );
  nearGroundSky.readyPromise
    .then(() => scene.requestRender())
    .catch((error) => console.error("近地天空盒加载失败", error));
}

/**
 * 滑块值：0=晴天，0.5=晴天/晚霞各50%，1=晚霞，2=夜晚。
 */
export function setScene(value) {
  const number = Number(value);
  transitionValue = Cesium.Math.clamp(
    Number.isFinite(number) ? number : 0,
    0,
    2,
  );
  if (nearGroundSky) nearGroundSky.value = transitionValue;
  viewer?.scene.requestRender();
}
