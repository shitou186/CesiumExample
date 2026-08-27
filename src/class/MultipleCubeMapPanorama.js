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

export default class MultipleCubeMapPanorama {
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
