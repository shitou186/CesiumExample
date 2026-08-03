export let viewer;

export function onMounted() {
  viewer = new Cesium.Viewer("cesiumContainer");
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}
