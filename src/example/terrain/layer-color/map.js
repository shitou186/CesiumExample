let viewer;

const TERRAIN_URL =
  "/terrain-api/tiles/dynamic?cog=%2Fhome%2Fshilei%2Fsource-data%2Ftiff%2FGF7_DLC_E110.6_N32.7_20250111_L1A0001829881_StereoPair%2FGF7_DLC_E110.6_N32.7_20250111_DEM0001829881-BWDPAN.tif&maxZoom=14";

const SAND_TABLE_STYLE = {
  backgroundColor: "#f4ecd8",
  baseColor: "#f4ecd8",
  clippingEdgeColor: "rgba(0,0,0,0)",
  verticalExaggeration: 3.2,
  maximumScreenSpaceError: 0.25,
  basePaddingRatio: 0.18,
  pedestalDepthRatio: 0.28,
  minPedestalDepth: 500.0,
  cameraRangeScale: 1.55,
  lightTime: "2023-06-21T09:00:00+08:00",
  lightAzimuth: 315.0,
  lightAltitude: 45.0,
  shadeAmbient: 0.035,
  shadeStrength: 1.0,
  shadeContrast: 1.2,
  hillshadeBlend: 0.98,
  atlasShadowPower: 2.35,
  slopeDarkness: 0.58,
  gamma: 1.08,
  saturation: 1.25,
  baseBrightness: 1.08,
  waterEnabled: false,
  shadowCutoff: 0.16,
  highlightCutoff: 0.94,
  rampStops: [0.38, 0.58, 0.76, 0.9],
  colors: {
    water: "#0025fe",
    valley: "#04fe00",
    low: "#c5fe00",
    middle: "#febb00",
    high: "#fe5a00",
    peak: "#fe0000",
  },
};

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
    baseLayer: false,
    imageryProvider: false,
    attribution: false,
  });

  configureScene();
  loadTerrain();
}

export function flyTo() {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(110.628511, 32.783291, 34997),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-35),
      roll: 0,
    },
    duration: 2,
  });
}

function configureScene() {
  const { scene } = viewer;
  const background = Cesium.Color.fromCssColorString(
    SAND_TABLE_STYLE.backgroundColor,
  );

  scene.skyBox.show = false;
  scene.skyAtmosphere.show = false;
  scene.backgroundColor = background;
  scene.highDynamicRange = true;
  scene.verticalExaggeration = SAND_TABLE_STYLE.verticalExaggeration;
  scene.postProcessStages.fxaa.enabled = true;

  scene.globe.baseColor = Cesium.Color.fromCssColorString(
    SAND_TABLE_STYLE.baseColor,
  );
  scene.globe.undergroundColor = background;
  scene.globe.showGroundAtmosphere = false;
  scene.globe.maximumScreenSpaceError =
    SAND_TABLE_STYLE.maximumScreenSpaceError;
  scene.globe.backFaceCulling = false;
  scene.globe.showSkirts = true;

  // 用自定义 shader 做固定方向的晕渲，避免 Cesium 内置日照再叠一层导致颜色发灰。
  scene.globe.enableLighting = false;

  // [新增]：覆盖系统默认的太阳光，提供一个固定的西北偏光
  viewer.scene.light = new Cesium.DirectionalLight({
    direction: new Cesium.Cartesian3(1.0, -1.0, -0.5),
    color: Cesium.Color.WHITE,
    intensity: 1.0,
  });

  viewer.shadows = false;
  scene.globe.shadows = Cesium.ShadowMode.DISABLED;

  viewer.clock.currentTime = Cesium.JulianDate.fromDate(
    new Date(SAND_TABLE_STYLE.lightTime),
  );
  viewer.clock.shouldAnimate = false;
}

// 地形加载
async function loadTerrain() {
  try {
    const terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(
      TERRAIN_URL,
      {
        requestVertexNormals: true,
      },
    );

    terrainProvider.errorEvent.addEventListener((error) => {
      console.error("地形瓦片加载失败：", error);
    });

    viewer.terrainProvider = terrainProvider;

    const layerData = await fetchLayerJson(TERRAIN_URL);

    const bbox = layerData.cogBounds || layerData.bounds;

    if (!bbox) {
      console.error("在 layer.json 中没有找到 cogBounds 或 bounds 属性！");
      return;
    }
    console.log("成功获取动态边界框:", bbox);

    const heightInfo = getHeightInfo(layerData);

    viewer.scene.globe.material = createTerrainMaterial({
      minHeight: heightInfo.minHeight,
      maxHeight: heightInfo.maxHeight,
      colors: SAND_TABLE_STYLE.colors,
      ambient: SAND_TABLE_STYLE.shadeAmbient,
      lightAzimuth: SAND_TABLE_STYLE.lightAzimuth,
      lightAltitude: SAND_TABLE_STYLE.lightAltitude,
      contrast: SAND_TABLE_STYLE.shadeContrast,
      shadeStrength: SAND_TABLE_STYLE.shadeStrength,
      hillshadeBlend: SAND_TABLE_STYLE.hillshadeBlend,
      atlasShadowPower: SAND_TABLE_STYLE.atlasShadowPower,
      slopeDarkness: SAND_TABLE_STYLE.slopeDarkness,
      gamma: SAND_TABLE_STYLE.gamma,
      saturation: SAND_TABLE_STYLE.saturation,
      baseBrightness: SAND_TABLE_STYLE.baseBrightness,
      waterEnabled: SAND_TABLE_STYLE.waterEnabled,
      shadowCutoff: SAND_TABLE_STYLE.shadowCutoff,
      highlightCutoff: SAND_TABLE_STYLE.highlightCutoff,
      rampStops: SAND_TABLE_STYLE.rampStops,
      contourEnable: false,
    });

    applyTerrainClipping(bbox);
    // addSandTableBase(bbox, heightInfo);
    flyToSandTable(bbox, heightInfo);

    console.log("成功获取动态边界框:", bbox);
  } catch (error) {
    console.error("地形晕渲初始化失败：", error);
  }
}

async function fetchLayerJson(terrainUrl) {
  const response = await fetch(getLayerJsonUrl(terrainUrl));

  if (!response.ok) {
    throw new Error(`layer.json 请求失败：${response.status}`);
  }

  return response.json();
}

function getLayerJsonUrl(terrainUrl) {
  const url = new URL(terrainUrl, window.location.origin);
  url.pathname = `${url.pathname.replace(/\/$/, "")}/layer.json`;
  return `${url.pathname}${url.search}`;
}

function getHeightInfo(layerData) {
  let minHeight = Number(layerData.min_z);
  let maxHeight = Number(layerData.max_z);

  if (!Number.isFinite(minHeight) || !Number.isFinite(maxHeight)) {
    console.warn("layer.json 缺少 min_z/max_z，使用默认高度范围。");
    minHeight = 0.0;
    maxHeight = 1000.0;
  }

  if (maxHeight < minHeight) {
    [minHeight, maxHeight] = [maxHeight, minHeight];
  }

  minHeight *= SAND_TABLE_STYLE.verticalExaggeration;
  maxHeight *= SAND_TABLE_STYLE.verticalExaggeration;

  let heightRange = maxHeight - minHeight;

  if (heightRange <= 0.0) {
    heightRange = 100.0;
    maxHeight = minHeight + heightRange;
  }

  return {
    minHeight,
    maxHeight,
    heightRange,
  };
}

function applyTerrainClipping(bbox) {
  const minLon = bbox[0];
  const minLat = bbox[1];
  const maxLon = bbox[2];
  const maxLat = bbox[3];

  // =================================================================
  // 下方完全复用你之前的裁剪和沙盘生成逻辑，数据已经完全动态化了！
  // =================================================================

  // 计算中心点
  const centerLon = (minLon + maxLon) / 2.0;
  const centerLat = (minLat + maxLat) / 2.0;
  const centerCartesian = Cesium.Cartesian3.fromDegrees(centerLon, centerLat);

  // 建立局部坐标系
  const localTransform =
    Cesium.Transforms.eastNorthUpToFixedFrame(centerCartesian);

  // 计算物理距离 (米)
  const leftPoint = Cesium.Cartesian3.fromDegrees(minLon, centerLat);
  const rightPoint = Cesium.Cartesian3.fromDegrees(maxLon, centerLat);
  const distanceX = Cesium.Cartesian3.distance(leftPoint, rightPoint) / 2.0;

  const bottomPoint = Cesium.Cartesian3.fromDegrees(centerLon, minLat);
  const topPoint = Cesium.Cartesian3.fromDegrees(centerLon, maxLat);
  const distanceY = Cesium.Cartesian3.distance(bottomPoint, topPoint) / 2.0;

  // 创建裁剪平面
  viewer.scene.globe.clippingPlanes = new Cesium.ClippingPlaneCollection({
    modelMatrix: localTransform,
    unionClippingRegions: true,
    planes: [
      // 【关键修复 2】所有的 distance 必须加负号！
      new Cesium.ClippingPlane(new Cesium.Cartesian3(1.0, 0.0, 0.0), distanceX), // 切掉东边
      new Cesium.ClippingPlane(
        new Cesium.Cartesian3(-1.0, 0.0, 0.0),
        distanceX,
      ), // 切掉西边
      new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, 1.0, 0.0), distanceY), // 切掉北边
      new Cesium.ClippingPlane(
        new Cesium.Cartesian3(0.0, -1.0, 0.0),
        distanceY,
      ), // 切掉南边
    ],
    edgeWidth: 0,
    edgeColor: Cesium.Color.fromCssColorString(
      SAND_TABLE_STYLE.clippingEdgeColor,
    ),
  });
}

function addSandTableBase(bbox, { minHeight, heightRange }) {
  const existing = viewer.entities.getById("terrain-sand-table-base");

  if (existing) {
    viewer.entities.remove(existing);
  }

  const [minLon, minLat, maxLon, maxLat] = bbox;
  const lonPadding = (maxLon - minLon) * SAND_TABLE_STYLE.basePaddingRatio;
  const latPadding = (maxLat - minLat) * SAND_TABLE_STYLE.basePaddingRatio;
  const baseHeight = minHeight - Math.max(heightRange * 0.08, 150.0);
  const bottomHeight =
    baseHeight -
    Math.max(
      heightRange * SAND_TABLE_STYLE.pedestalDepthRatio,
      SAND_TABLE_STYLE.minPedestalDepth,
    );

  viewer.entities.add({
    id: "terrain-sand-table-base",
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray([
        minLon - lonPadding,
        minLat - latPadding,
        maxLon + lonPadding,
        minLat - latPadding,
        maxLon + lonPadding,
        maxLat + latPadding,
        minLon - lonPadding,
        maxLat + latPadding,
      ]),
      height: baseHeight,
      extrudedHeight: bottomHeight,
      material: Cesium.Color.fromCssColorString(SAND_TABLE_STYLE.baseColor),
      outline: false,
      closeTop: true,
      closeBottom: true,
    },
  });
}

function flyToSandTable(bbox, { minHeight, maxHeight, heightRange }) {
  const bounds = getBoundsInfo(bbox);
  const points = [
    Cesium.Cartesian3.fromDegrees(bounds.minLon, bounds.minLat, minHeight),
    Cesium.Cartesian3.fromDegrees(bounds.maxLon, bounds.minLat, minHeight),
    Cesium.Cartesian3.fromDegrees(bounds.maxLon, bounds.maxLat, maxHeight),
    Cesium.Cartesian3.fromDegrees(bounds.minLon, bounds.maxLat, maxHeight),
  ];
  const boundingSphere = Cesium.BoundingSphere.fromPoints(points);
  const range =
    Math.max(bounds.halfWidth * 2.0, bounds.halfHeight * 2.0, heightRange) *
    SAND_TABLE_STYLE.cameraRangeScale;

  viewer.camera.flyToBoundingSphere(boundingSphere, {
    duration: 2,
    offset: new Cesium.HeadingPitchRange(
      Cesium.Math.toRadians(0),
      Cesium.Math.toRadians(-30),
      range,
    ),
  });
}

function getBoundsInfo(bbox) {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const centerLon = (minLon + maxLon) / 2.0;
  const centerLat = (minLat + maxLat) / 2.0;

  const leftPoint = Cesium.Cartesian3.fromDegrees(minLon, centerLat);
  const rightPoint = Cesium.Cartesian3.fromDegrees(maxLon, centerLat);
  const bottomPoint = Cesium.Cartesian3.fromDegrees(centerLon, minLat);
  const topPoint = Cesium.Cartesian3.fromDegrees(centerLon, maxLat);

  return {
    minLon,
    minLat,
    maxLon,
    maxLat,
    centerLon,
    centerLat,
    halfWidth: Cesium.Cartesian3.distance(leftPoint, rightPoint) / 2.0,
    halfHeight: Cesium.Cartesian3.distance(bottomPoint, topPoint) / 2.0,
  };
}
/**
 * Global-Mapper-style Atlas terrain shader for Cesium globe materials.
 * Uses materialInput.height for the Atlas color ramp and materialInput.slope/aspect
 * for camera-independent geographic hill shading.
 */

const DEFAULT_COLORS = {
  water: "#0025fe",
  valley: "#04fe00",
  low: "#c5fe00",
  middle: "#febb00",
  high: "#fe5a00",
  peak: "#fe0000",
};

/* ── Helpers ───────────────────────────────────────────────────────── */

const SHADER_SOURCE = `
const float PI = 3.141592653589793;
const float TWO_PI = 6.283185307179586;

float saturate(float value) {
    return clamp(value, 0.0, 1.0);
}

float wrapRadians(float angle) {
    return mod(angle + TWO_PI, TWO_PI);
}

float azimuthToAspectAngle(float azimuthDeg) {
    return wrapRadians(radians(90.0 - azimuthDeg));
}

float directionalLambert(float slope, float aspect, float azimuthDeg, float altitudeDeg) {
    float altitude = radians(altitudeDeg);
    float lightAspect = azimuthToAspectAngle(azimuthDeg);
    return sin(altitude) * cos(slope)
         + cos(altitude) * sin(slope) * cos(aspect - lightAspect);
}

float globalMapperHillshade(float slope, float aspect) {
    float primary = max(directionalLambert(slope, aspect, lightAzimuth, lightAltitude), 0.0);
    float fill = max(directionalLambert(slope, aspect, lightAzimuth + 95.0, lightAltitude * 0.55), 0.0);
    float back = max(directionalLambert(slope, aspect, lightAzimuth + 180.0, lightAltitude * 0.45), 0.0);

    float shade = primary * 0.9 + fill * 0.075 + back * 0.025;
    shade = pow(saturate(shade * shadeStrength), contrast);
    shade = smoothstep(shadowCutoff, highlightCutoff, shade);
    return pow(saturate(shade), atlasShadowPower);
}

vec3 getRampColor(float t, float height) {
    if (waterEnabled > 0.5 && height < seaLevel) {
        return waterColor.rgb;
    }

    float s0 = rampStops.x;
    float s1 = rampStops.y;
    float s2 = rampStops.z;
    float s3 = rampStops.w;

    if (t <= s0) {
        return mix(valleyColor.rgb, lowColor.rgb, smoothstep(0.0, s0, t));
    }
    if (t <= s1) {
        return mix(lowColor.rgb, middleColor.rgb, smoothstep(s0, s1, t));
    }
    if (t <= s2) {
        return mix(middleColor.rgb, highColor.rgb, smoothstep(s1, s2, t));
    }
    if (t <= s3) {
        return mix(highColor.rgb, peakColor.rgb, smoothstep(s2, s3, t));
    }

    return peakColor.rgb;
}

float aspectFacingLight(float aspect) {
    return cos(aspect - azimuthToAspectAngle(lightAzimuth));
}

vec3 applyGlobalMapperLighting(vec3 color, float shade, float slope, float aspect) {
    float slopeTerm = smoothstep(0.035, 0.95, slope);
    float shadow = mix(1.0, shade, hillshadeBlend * slopeTerm);
    float facing = aspectFacingLight(aspect);
    float valley = max(-facing, 0.0) * slopeTerm;

    vec3 lit = color * max(ambient, shadow) * baseBrightness;
    lit *= 1.0 - valley * slopeDarkness * (1.0 - shade);
    lit *= 1.0 - slopeTerm * slopeDarkness * 0.12;

    return lit;
}

vec3 applyGamma(vec3 color, float g) {
    return pow(max(color, vec3(0.0)), vec3(g));
}

vec3 applySaturation(vec3 color, float sat) {
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(vec3(gray), color, sat);
}

vec3 applyContours(vec3 color, float height, float interval, float width) {
    float h = fract(height / max(interval, 0.001));
    float dist = min(h, 1.0 - h);
    float line = 1.0 - smoothstep(0.0, width, dist);
    return mix(color, vec3(0.03), line * 0.65);
}

czm_material czm_getMaterial(czm_materialInput materialInput) {
    czm_material material = czm_getDefaultMaterial(materialInput);

    float heightRange = max(maxHeight - minHeight, 1.0);
    float t = clamp((materialInput.height - minHeight) / heightRange, 0.0, 1.0);
    float slope = clamp(materialInput.slope, 0.0, PI * 0.5);
    float aspect = wrapRadians(materialInput.aspect);

    vec3 color = getRampColor(t, materialInput.height);
    float shade = globalMapperHillshade(slope, aspect);

    color = applyGlobalMapperLighting(color, shade, slope, aspect);
    color = applyGamma(color, gamma);
    color = applySaturation(color, saturation);

    if (contourEnable > 0.5) {
        color = applyContours(color, materialInput.height, contourInterval, contourWidth);
    }

    material.diffuse = clamp(color, 0.0, 1.0);
    material.alpha = 1.0;

    return material;
}
`;

/* ── Public API ────────────────────────────────────────────────────── */

/**
 * Create a Cesium.Material that applies an Atlas elevation color ramp and
 * Global-Mapper-style high-contrast hill shading to Cesium globe terrain.
 *
 * @param {Object} options
 * @param {number} options.minHeight Minimum exaggerated terrain height in meters.
 * @param {number} options.maxHeight Maximum exaggerated terrain height in meters.
 * @param {Object} [options.colors] CSS hex strings for water/valley/low/middle/high/peak.
 * @param {number} [options.lightAzimuth=315] Light azimuth in degrees clockwise from north.
 * @param {number} [options.lightAltitude=45] Light altitude in degrees above the horizon.
 * @param {number} [options.ambient=0.035] Minimum shadow brightness.
 * @param {number} [options.hillshadeBlend=0.98] Blend amount from flat color to hillshade.
 * @param {number} [options.atlasShadowPower=2.35] Shadow contrast exponent.
 * @returns {Cesium.Material}
 */
export function createTerrainMaterial(options = {}) {
  const {
    minHeight = 0,
    maxHeight = 1000,
    colors = {},
    ambient = 0.035,
    shadeStrength = 1.0,
    contrast = 1.2,
    gamma = 1.08,
    saturation = 1.25,
    lightAzimuth = 315.0,
    lightAltitude = 45.0,
    hillshadeBlend = 0.98,
    atlasShadowPower = 2.35,
    slopeDarkness = 0.58,
    baseBrightness = 1.08,
    seaLevel = 0.0,
    waterEnabled = false,
    shadowCutoff = 0.16,
    highlightCutoff = 0.94,
    contourEnable = false,
    contourInterval = 100,
    contourWidth = 0.003,
    rampStops = [0.38, 0.58, 0.76, 0.9],
  } = options;

  return new Cesium.Material({
    fabric: {
      type: "AtlasHillshadeTerrain",
      uniforms: {
        waterColor: Cesium.Color.fromCssColorString(
          colors.water || DEFAULT_COLORS.water,
        ),
        valleyColor: Cesium.Color.fromCssColorString(
          colors.valley || DEFAULT_COLORS.valley,
        ),
        lowColor: Cesium.Color.fromCssColorString(
          colors.low || DEFAULT_COLORS.low,
        ),
        middleColor: Cesium.Color.fromCssColorString(
          colors.middle || DEFAULT_COLORS.middle,
        ),
        highColor: Cesium.Color.fromCssColorString(
          colors.high || DEFAULT_COLORS.high,
        ),
        peakColor: Cesium.Color.fromCssColorString(
          colors.peak || DEFAULT_COLORS.peak,
        ),
        minHeight,
        maxHeight,
        seaLevel,
        waterEnabled: waterEnabled ? 1.0 : 0.0,
        ambient,
        shadeStrength,
        contrast,
        gamma,
        saturation,
        lightAzimuth,
        lightAltitude,
        hillshadeBlend,
        atlasShadowPower,
        slopeDarkness,
        baseBrightness,
        shadowCutoff,
        highlightCutoff,
        contourEnable: contourEnable ? 1.0 : 0.0,
        contourInterval,
        contourWidth,
        rampStops: new Cesium.Cartesian4(
          rampStops[0],
          rampStops[1],
          rampStops[2],
          rampStops[3],
        ),
      },
      source: SHADER_SOURCE,
    },
  });
}
