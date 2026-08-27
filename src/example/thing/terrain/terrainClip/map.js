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
  });
  viewer.scene.globe.depthTestAgainstTerrain = true;
  flyTo();
  addTerrain();

  setTimeout(() => {
    const terrainClip = new MultiTerrainClip(viewer, {
      stylePit: {
        diffHeight: 50, // 井的深度
        image: "/img/textures/poly-stone.jpg",
        imageBottom: "/img/textures/poly-soil.jpg",
        splitNum: 80, // 井边界插值数
      },
    });

    terrainClip.addArea(
      [
        [116.334222, 30.899171, 645.46],
        [116.370874, 30.899171, 645.46],
        [116.370874, 30.944509, 645.46],
        [116.334222, 30.944509, 645.46],
      ],
      { diffHeight: 900, exact: true },
    );

    terrainClip.addArea(
      [
        [116.416497, 30.934256, 775.89],
        [116.427392, 30.962941, 1084.88],
        [116.434838, 30.932608, 900.43],
        [116.462994, 30.923081, 771.42],
        [116.437571, 30.916044, 906.39],
        [116.44977, 30.894487, 776.06],
        [116.424183, 30.908752, 727.02],
        [116.402218, 30.898406, 593.08],
        [116.414309, 30.918806, 588.78],
        [116.387022, 30.933539, 700.65],
      ],
      { diffHeight: 200, exact: true },
    );
  }, 2000);
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}

export function flyTo() {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.378229, 30.827414, 16933),
    orientation: {
      heading: Cesium.Math.toRadians(0), // 朝北（0 弧度）
      pitch: Cesium.Math.toRadians(-56), // 向下俯视 30 度
      roll: 0, // 不滚动
    },
    duration: 2,
  });
}

async function addTerrain() {
  const url = "http://data.mars3d.cn/terrain";
  const provider = await Cesium.CesiumTerrainProvider.fromUrl(url, {
    requestVertexNormals: true, // 光照法线
    requestWaterMask: true, // 水面效果
  });
  viewer.terrainProvider = provider;
}

class MultiTerrainClip {
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.options = {
      clipOutSide: false,
      enabled: true,
      stylePit: {
        diffHeight: 50, // 默认深度
        image: null, // 侧壁贴图 URL
        imageBottom: null, // 坑底贴图 URL
        splitNum: 0, // 边界插值点数
        ...options.stylePit,
      },
      ...options,
    };

    this.clippingPolygons = [];
    this.entities = [];

    this._initClippingCollection();
  }

  // 初始化 ClippingPolygonCollection
  _initClippingCollection() {
    this.clippingPolygonCollection = new Cesium.ClippingPolygonCollection({
      polygons: [],
      inverse: this.options.clipOutSide,
      enabled: this.options.enabled,
    });
    this.viewer.scene.globe.clippingPolygons = this.clippingPolygonCollection;
  }

  /**
   * 动态添加开挖区域
   * @param {Array<Array<number>>} positions 坐标数组 [[lng, lat, alt], ...]
   * @param {Object} areaOptions 单个区域覆盖参数，如 { diffHeight: 900, exact: true }
   */
  addArea(positions, areaOptions = {}) {
    if (!positions || positions.length < 3) return;

    // 优先使用传入的 areaOptions，没有则回退到 全局 stylePit 的配置
    const depth =
      areaOptions.diffHeight ?? this.options.stylePit.diffHeight ?? 50;
    const splitNum =
      areaOptions.splitNum ?? this.options.stylePit.splitNum ?? 0;
    const image = areaOptions.image || this.options.stylePit.image;
    const imageBottom =
      areaOptions.imageBottom || this.options.stylePit.imageBottom;

    // 1. 边界插值处理 (splitNum)
    const processedPositions = this._interpolatePositions(positions, splitNum);

    // 2. 提取经纬度与 Cartesian3 坐标
    const degreesArray = [];
    const cartesianPositions = [];
    let minSurfaceHeight = Infinity;

    processedPositions.forEach((pos) => {
      const lng = pos[0];
      const lat = pos[1];
      const alt = pos[2] || 0;

      degreesArray.push(lng, lat);
      cartesianPositions.push(Cesium.Cartesian3.fromDegrees(lng, lat, alt));

      if (alt < minSurfaceHeight) {
        minSurfaceHeight = alt;
      }
    });

    // 3. 创建 Cesium 原生裁剪多边形
    const clippingPolygon = new Cesium.ClippingPolygon({
      positions: Cesium.Cartesian3.fromDegreesArray(degreesArray),
    });

    // 添加到 Cesium 裁剪集合中
    this.clippingPolygonCollection.add(clippingPolygon);
    this.clippingPolygons.push(clippingPolygon);

    // 4. 创建坑底与井壁
    this._createPitAndWall(
      cartesianPositions,
      minSurfaceHeight,
      depth,
      image,
      imageBottom,
    );
  }

  /**
   * 创建坑底和井壁
   */
  _createPitAndWall(positions, surfaceHeight, depth, image, imageBottom) {
    const bottomHeight = surfaceHeight - depth;

    // ----- A. 创建坑底材质 -----
    let bottomMaterial = Cesium.Color.DARKGRAY.withAlpha(0.9);
    if (imageBottom) {
      bottomMaterial = new Cesium.ImageMaterialProperty({
        image: imageBottom,
        repeat: new Cesium.Cartesian2(1, 1),
      });
    }

    // 创建坑底 Entity
    const bottomEntity = this.viewer.entities.add({
      polygon: {
        hierarchy: positions,
        height: bottomHeight,
        material: bottomMaterial,
      },
    });
    this.entities.push(bottomEntity);

    // ----- B. 创建井壁材质 -----
    let wallMaterial = Cesium.Color.BROWN.withAlpha(0.8);
    if (image) {
      wallMaterial = new Cesium.ImageMaterialProperty({
        image: image,
        repeat: new Cesium.Cartesian2(8, 1), // 可以适当调节平铺比例
      });
    }

    const wallPositions = [...positions, positions[0]]; // 形成闭环
    const maxHeights = new Array(wallPositions.length).fill(surfaceHeight);
    const minHeights = new Array(wallPositions.length).fill(bottomHeight);

    // 创建井壁 Entity
    const wallEntity = this.viewer.entities.add({
      wall: {
        positions: wallPositions,
        maximumHeights: maxHeights,
        minimumHeights: minHeights,
        material: wallMaterial,
      },
    });
    this.entities.push(wallEntity);
  }

  /**
   * 线性插值，增加边界采样点数（提升弯曲或复杂多边形裁切的平滑度）
   */
  _interpolatePositions(positions, splitNum) {
    if (!splitNum || splitNum <= 0) return positions;

    const result = [];
    const count = positions.length;

    for (let i = 0; i < count; i++) {
      const p1 = positions[i];
      const p2 = positions[(i + 1) % count];
      result.push(p1);

      for (let j = 1; j <= splitNum; j++) {
        const factor = j / (splitNum + 1);
        const lng = p1[0] + (p2[0] - p1[0]) * factor;
        const lat = p1[1] + (p2[1] - p1[1]) * factor;
        const alt = p1[2] + (p2[2] - p1[2]) * factor;
        result.push([lng, lat, alt]);
      }
    }
    return result;
  }

  /**
   * 清除所有开挖效果
   */
  clear() {
    if (this.clippingPolygonCollection) {
      this.clippingPolygonCollection.removeAll();
    }
    this.entities.forEach((entity) => this.viewer.entities.remove(entity));
    this.entities = [];
    this.clippingPolygons = [];
  }

  /**
   * 销毁实例
   */
  destroy() {
    this.clear();
    if (this.viewer.scene.globe.clippingPolygons) {
      this.viewer.scene.globe.clippingPolygons = undefined;
    }
  }
}
