import { flatten } from "lodash-es";
import * as turf from "@turf/turf";
export let viewer;

function getPolygonClipping() {
  const library = globalThis.polygonClipping;
  if (!library || typeof library.difference !== "function") {
    throw new Error(
      "polygon-clipping is unavailable. Check this example's resources configuration.",
    );
  }
  return library;
}

export function difference(subject, ...clipGeometries) {
  const library = getPolygonClipping();
  return library.difference(subject, ...clipGeometries);
}

export function onMounted() {
  getPolygonClipping();
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
        alpha: true,
      },
    },
  });
  addGeoJson();
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}

// 数据获取 https://datav.aliyun.com/portal/school/atlas/area_generator
function addGeoJson() {
  fetch("./geojson/420100.geojson")
    .then((response) => response.json())
    .then((response) => {
      const outerLine = turf.polygonToLine(response.features[0]);
      const holes = flatten(outerLine.features[0].geometry.coordinates);
      const positionsLine = Cesium.Cartesian3.fromDegreesArray(holes);
      const area = new Cesium.Entity({
        id: 1,
        polygon: {
          hierarchy: {
            positions: Cesium.Cartesian3.fromDegreesArray([
              100, 0, 100, 89, 150, 89, 150, 0,
            ]), //外部区域
            holes: [
              {
                positions: positionsLine, //挖空区域
              },
            ],
          },
          material: Cesium.Color.BLUE.withAlpha(0.6), //外部颜色
        },
      });
      const line = new Cesium.Entity({
        id: 2,
        polyline: {
          positions: positionsLine,
          width: 2, //边界线宽
          material: Cesium.Color.fromCssColorString("#6dcdeb"), //边界线颜色
        },
      });
      viewer.entities.add(area);
      viewer.entities.add(line);
      viewer.flyTo(line);
    });
}

