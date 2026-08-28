export default class MultiTerrainClip {
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    // 检查地形提供者
    if (
      !(viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider) &&
      !viewer.terrainProvider.availability
    ) {
      console.warn(
        "MultiTerrainClip: 当前未加载有效地形，'exact'精确贴合功能可能失效。",
      );
    }

    this.options = {
      clipOutSide: false,
      enabled: true,
      stylePit: {
        diffHeight: 30, // 默认深度
        image: null,
        imageBottom: null,
        splitNum: 0,
        exact: true, // 默认开启精确贴合
        ...options.stylePit,
      },
      ...options,
    };

    this.clippingPolygons = [];
    this.entities = [];

    this._initClippingCollection();
  }

  _initClippingCollection() {
    this.clippingPolygonCollection = new Cesium.ClippingPolygonCollection({
      polygons: [],
      inverse: this.options.clipOutSide,
      enabled: this.options.enabled,
    });
    this.viewer.scene.globe.clippingPolygons = this.clippingPolygonCollection;
  }

  /**
   * 动态添加开挖区域 (已修正为异步)
   */
  async addArea(positions, areaOptions = {}) {
    if (!positions || positions.length < 3) return;

    const depth =
      areaOptions.diffHeight ?? this.options.stylePit.diffHeight ?? 30;
    const splitNum =
      areaOptions.splitNum ?? this.options.stylePit.splitNum ?? 0;
    const isExact = areaOptions.exact ?? this.options.stylePit.exact ?? true; // 是否精确贴合
    const image = areaOptions.image || this.options.stylePit.image;
    const imageBottom =
      areaOptions.imageBottom || this.options.stylePit.imageBottom;

    // 1. 边界插值处理 (防止大区域因曲率穿模)
    const interpolatedDegrees = this._interpolatePositions(positions, splitNum);

    // 2. 将经纬度转换为 Cartographic 对象，准备用于地形采样
    const cartographicsForSampling = interpolatedDegrees.map((pos) =>
      Cesium.Cartographic.fromDegrees(pos[0], pos[1]),
    );

    let sampledCartographics;

    // --- 核心修正：地形采样 ---
    if (
      isExact &&
      this.viewer.terrainProvider &&
      !(this.viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider)
    ) {
      try {
        // 异步请求最详细的地形高度
        sampledCartographics = await Cesium.sampleTerrainMostDetailed(
          this.viewer.terrainProvider,
          cartographicsForSampling,
        );
      } catch (error) {
        console.error("地形采样失败，将使用传入的固定高度:", error);
        // 采样失败回退：使用传入坐标中的高度
        sampledCartographics = positions.map((pos) =>
          Cesium.Cartographic.fromDegrees(pos[0], pos[1], pos[2] || 0),
        );
      }
    } else {
      // 不开启精确贴合或无地形，直接使用传入的高度
      sampledCartographics = positions.map((pos) =>
        Cesium.Cartographic.fromDegrees(pos[0], pos[1], pos[2] || 0),
      );
    }

    // 3. 准备渲染数据
    const degreesArrayForClipping = [];
    const wallTopCartesians = [];
    let maxSurfaceHeight = -Infinity;
    let minSurfaceHeight = Infinity;

    sampledCartographics.forEach((carto) => {
      // 裁剪面使用的经纬度
      degreesArrayForClipping.push(
        Cesium.Math.toDegrees(carto.longitude),
        Cesium.Math.toDegrees(carto.latitude),
      );

      // 井壁顶部使用的采样后的精确 Cartesian3 坐标
      const topPoint = Cesium.Cartographic.toCartesian(carto);
      wallTopCartesians.push(topPoint);

      // 记录区域内的最高和最低地表高度，用于计算坑底
      if (carto.height > maxSurfaceHeight) maxSurfaceHeight = carto.height;
      if (carto.height < minSurfaceHeight) minSurfaceHeight = carto.height;
    });

    // 4. 创建 Cesium 原生裁剪多边形
    const clippingPolygon = new Cesium.ClippingPolygon({
      positions: Cesium.Cartesian3.fromDegreesArray(degreesArrayForClipping),
    });

    this.clippingPolygonCollection.add(clippingPolygon);
    this.clippingPolygons.push(clippingPolygon);

    // 5. 创建坑底与井壁
    this._createPitAndWall({
      topPositions: wallTopCartesians, // 这是一个数组，包含每个采样点精确的顶部坐标
      minSurfaceHeight: minSurfaceHeight,
      depth: depth,
      image: image,
      imageBottom: imageBottom,
    });
  }

  /**
   * 创建坑底和井壁 (已修正为贴合地形)
   */
  _createPitAndWall(data) {
    const { topPositions, minSurfaceHeight, depth, image, imageBottom } = data;

    // 坑底高度：使用采样到的区域内最低地表高度减去深度，确保坑底不穿出地面
    const bottomHeight = minSurfaceHeight - depth;

    // ----- A. 创建坑底 -----
    let bottomMaterial = Cesium.Color.DARKGRAY.withAlpha(0.9);
    if (imageBottom) {
      bottomMaterial = new Cesium.ImageMaterialProperty({
        image: imageBottom,
        repeat: new Cesium.Cartesian2(1, 1),
      });
    }

    const bottomEntity = this.viewer.entities.add({
      polygon: {
        // 坑底使用采样后的顶部坐标投影到同一高度
        hierarchy: topPositions,
        material: bottomMaterial,
        // 异步采样后，需要确保 Entity 在地形加载后重新计算高度
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        perPositionHeight: true, // 开启节点独立高程，确保严格按照 bottomHeight 渲染
      },
    });
    // 修正：Polygon 的 height 属性需要是绝对高度，RELATIVE_TO_GROUND 不适用平的多边形
    // 重新修正：
    const bottomPoints = topPositions.map((p) => {
      const carto = Cesium.Cartographic.fromCartesian(p);
      return Cesium.Cartesian3.fromRadians(
        carto.longitude,
        carto.latitude,
        bottomHeight,
      );
    });
    bottomEntity.polygon.hierarchy = bottomPoints;
    delete bottomEntity.polygon.heightReference; // 移除错误的属性

    this.entities.push(bottomEntity);

    // ----- B. 创建井壁 -----
    let wallMaterial = Cesium.Color.BROWN.withAlpha(0.8);
    if (image) {
      wallMaterial = new Cesium.ImageMaterialProperty({
        image: image,
        repeat: new Cesium.Cartesian2(8, 1),
      });
    }

    // 将采样后的顶部点闭环
    const wallTopPositions = [...topPositions, topPositions[0]];

    // 计算每个点对应的底部高度
    const wallMinimumHeights = wallTopPositions.map((p) => {
      const carto = Cesium.Cartographic.fromCartesian(p);
      // 方法1：井壁底部是平的 (使用统一的 bottomHeight)
      return bottomHeight;
      // 方法2：井壁底部随地形起伏 (使用该点的采样高度 - depth) -> 通常方法1效果更好，像个真正的井
      // return carto.height - depth;
    });

    const wallEntity = this.viewer.entities.add({
      wall: {
        positions: wallTopPositions, // 这里的 positions 已经是包含精确高度的 Cartesian3 采样点
        minimumHeights: wallMinimumHeights, // 底部高度数组
        // maximumHeights: 默认为 positions 中的高度，即采样到的精确地表高度
        material: wallMaterial,
      },
    });
    this.entities.push(wallEntity);
  }

  // ... (保留之前的 _interpolatePositions, clear, destroy 方法) ...
  /**
   * 线性插值，增加边界采样点数
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
        const alt = p1[2] + (p2[2] - p1[2]) * factor; // 插值时暂用传入高度
        result.push([lng, lat, alt]);
      }
    }
    return result;
  }

  clear() {
    if (this.clippingPolygonCollection)
      this.clippingPolygonCollection.removeAll();
    this.entities.forEach((entity) => this.viewer.entities.remove(entity));
    this.entities = [];
    this.clippingPolygons = [];
  }

  destroy() {
    this.clear();
    if (this.viewer.scene.globe.clippingPolygons)
      this.viewer.scene.globe.clippingPolygons = undefined;
  }
}
