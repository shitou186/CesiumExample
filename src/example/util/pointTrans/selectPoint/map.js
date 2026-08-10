export let viewer;
let selectPoint = null;
let onPickCallback = null; // 保存全局点击回调函数[cite: 2]
let markerPickerInstance = null; // 保存点位拾取控制器实例[cite: 2]

export async function onMounted() {
  viewer = new Cesium.Viewer("cesiumContainer", {
    fxaa: true,
    timeline: false,
    animation: false,
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
      webgl: {
        preserveDrawingBuffer: true,
      },
    },
  });
  flyTo();
  markerPickerInstance = enableCoordinatePickerWithMarker(viewer);
}

/**
 * 注册拾取完成时的回调函数[cite: 1, 2]
 */
export function onPointPicked(cb) {
  onPickCallback = cb;
}

/**
 * 注销拾取完成时的回调函数[cite: 2]
 */
export function offPointPicked() {
  onPickCallback = null;
}

/**
 * 清除地图标注和缓存数据[cite: 1, 2]
 */
export function clearMarker() {
  selectPoint = null;
  if (markerPickerInstance && markerPickerInstance.removeMarker) {
    markerPickerInstance.removeMarker();
  }
}

/**
 * 根据坐标类型选择填充对象
 */
export function selectType(radio, obj) {
  if (!selectPoint) return false;

  if (radio === "1") {
    obj.lng = selectPoint.decimal.longitude;
    obj.lat = selectPoint.decimal.latitude;
    obj.alt = selectPoint.decimal.height;
  } else if (radio === "2") {
    obj.lng = selectPoint.dms.longitude;
    obj.lat = selectPoint.dms.latitude;
    obj.alt = selectPoint.dms.height;
  } else if (radio === "3") {
    obj.lng = selectPoint.planeEPSG3857.x;
    obj.lat = selectPoint.planeEPSG3857.y;
    obj.alt = selectPoint.planeEPSG3857.height;
  }
  return true;
}

export function getSelectPoint() {
  return selectPoint;
}

export function flyTo() {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.391193, 39.906776, 1000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-30),
      roll: 0,
    },
    duration: 2.5,
  });
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}

function toDMS(deg, posSuffix = "", negSuffix = "") {
  const suffix = deg >= 0 ? posSuffix : negSuffix;
  const absDeg = Math.abs(deg);
  const d = Math.floor(absDeg);
  const mFull = (absDeg - d) * 60;
  const m = Math.floor(mFull);
  const s = ((mFull - m) * 60).toFixed(2);
  return `${d}°${m}'${s}"${suffix ? " " + suffix : ""}`;
}

function enableCoordinatePickerWithMarker(viewer) {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  const webMercatorProj = new Cesium.WebMercatorProjection();

  let currentPointEntity = null;

  handler.setInputAction((movement) => {
    let cartesian = viewer.scene.pickPosition(movement.position);

    if (!Cesium.defined(cartesian)) {
      const ray = viewer.camera.getPickRay(movement.position);
      cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    }

    if (!cartesian) return;

    if (currentPointEntity) {
      currentPointEntity.position = cartesian;
    } else {
      currentPointEntity = viewer.entities.add({
        name: "拾取标记点",
        position: cartesian,
        point: {
          pixelSize: 12,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const lng = Cesium.Math.toDegrees(cartographic.longitude);
    const lat = Cesium.Math.toDegrees(cartographic.latitude);
    const height = cartographic.height;

    const lngDMS = toDMS(lng, "E", "W");
    const latDMS = toDMS(lat, "N", "S");
    const planeCoord = webMercatorProj.project(cartographic);

    selectPoint = {
      decimal: {
        longitude: lng.toFixed(6),
        latitude: lat.toFixed(6),
        height: height.toFixed(2),
      },
      dms: { longitude: lngDMS, latitude: latDMS, height: height.toFixed(2) },
      planeEPSG3857: {
        x: planeCoord.x.toFixed(2),
        y: planeCoord.y.toFixed(2),
        height: height.toFixed(2),
      },
      cartesian3: {
        x: cartesian.x.toFixed(2),
        y: cartesian.y.toFixed(2),
        z: cartesian.z.toFixed(2),
      },
    };

    // 点击后自动调用注册的回调通知 Vue 页面进行数据刷新[cite: 1, 2]
    if (typeof onPickCallback === "function") {
      onPickCallback(selectPoint);
    }

  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  return {
    removeMarker: () => {
      if (currentPointEntity) {
        viewer.entities.remove(currentPointEntity);
        currentPointEntity = null;
      }
    },
    destroy: () => {
      handler.destroy();
      if (currentPointEntity) {
        viewer.entities.remove(currentPointEntity);
        currentPointEntity = null;
      }
    },
  };
}