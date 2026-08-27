export default class MultiTerrainClip {
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

globalThis.MultiTerrainClip = MultiTerrainClip;
