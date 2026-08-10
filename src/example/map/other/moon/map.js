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
    baseLayer: false,
    // 禁用导航说明（左上角的帮助提示）
    navigationHelpButton: false,
    // 禁用信息框（点击实体时弹出的信息窗口）
    infoBox: false,
    attribution: false,
    contextOptions: {
      webgl: {
        alpha: true,
      },
    },
  });
  setScene();
  flyTo();
  addLayer();
  loadTerrain();
  addGeoJson();
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}

export function flyTo() {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(140.299388, 19.163909, 4139723),
    orientation: {
      heading: Cesium.Math.toRadians(0), // 朝北（0 弧度）
      pitch: Cesium.Math.toRadians(-90), // 向下俯视 30 度
      roll: 0, // 不滚动
    },
    duration: 2,
  });
}

export function setScene() {
  const scene = viewer.scene;
  viewer.container.style.backgroundImage =
    'url("/img/busines/background-moon.jpg")';

  viewer.container.style.backgroundSize = "cover";
  viewer.container.style.backgroundPosition = "center";
  viewer.container.style.backgroundRepeat = "no-repeat";
  viewer.container.style.backgroundColor = "#071426";
  if (scene.skyBox) {
    scene.skyBox.show = false;
  }
  if (scene.skyAtmosphere) {
    scene.skyAtmosphere.show = false;
  }
  if (scene.sun) {
    scene.sun.show = false;
  }
  if (scene.moon) {
    scene.moon.show = false;
  }
  scene.backgroundColor = Cesium.Color.TRANSPARENT;
  scene.requestRender();
}

async function loadTerrain() {
  // console.log("加载地形");
  const url =
    "https://moon.bao.ac.cn/gis3globleMarsMoon/tilesets/MoonTerrain/2000/";
  viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(url, {
    requestVertexNormals: true,
    requestWaterMask: true,
  });
}

// 嫦娥1号月球影像图
function addLayer() {
  const xyzProvider = new Cesium.UrlTemplateImageryProvider({
    url: "https://moon.bao.ac.cn/gis3globleMarsMoon/tiles/getTiles/MoonTile/2000/jpg/{z}/{reverseY}/{x}",
    // 如果瓦片采用 TMS 规范（Y 轴翻转/由南向北），可以取消下面这行的注释：
    // scheme: 'tms',
    minimumLevel: 0,
    maximumLevel: 18,
  });
  viewer.imageryLayers.addImageryProvider(xyzProvider);
}

// https://data.mars3d.cn/file/geojson/moon-name.json
function addGeoJson() {
  // 1. 加载 GeoJSON 数据
  Cesium.GeoJsonDataSource.load("/geojson/moon-name.json", {
    // 可在此处取消默认点/线的渲染样式（可选）
    clampToGround: true, // 是否贴地
  })
    .then(function (dataSource) {
      viewer.dataSources.add(dataSource);

      const entities = dataSource.entities.values;

      // 2. 遍历所有 Entity 进行自定义处理
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];

        // 获取 GeoJSON 中属性字段，假设字段名为 'name'
        const nameText = entity.properties["中文译名"] ?? "未命名";

        // 3. 配置 Label 文字显示
        entity.label = new Cesium.LabelGraphics({
          text: nameText,
          font: "14px sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          // 避免被地形或三维模型遮挡（可选）
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        });

        // 4. 隐藏默认生成的图标/点/线/面，仅保留 Label
        entity.billboard = undefined; // 移除默认的图标钉子 (Pin)
        entity.point = undefined; // 如果有 Point，将其移除

        // 如果是面/线要素，且不需要显示边框和填充，可设置为 false
        if (entity.polygon) entity.polygon.show = false;
        if (entity.polyline) entity.polyline.show = false;
      }
    })
    .catch(function (error) {
      console.error("GeoJSON 加载失败:", error);
    });
}
