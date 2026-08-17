export let leftViewer;
export let rightViewer;

let activeViewer;
let removeLeftPostRender;
let removeRightPostRender;
let leftDom;
let rightDom;

const handleLeftMouseEnter = () => {
  activeViewer = leftViewer;
};

const handleRightMouseEnter = () => {
  activeViewer = rightViewer;
};

export function onMounted() {
  init();
}

function syncCamera(sourceViewer, targetViewer) {
  const camera = sourceViewer.camera;
  targetViewer.camera.setView({
    destination: camera.positionWC.clone(),
    orientation: {
      heading: camera.heading,
      pitch: camera.pitch,
      roll: camera.roll,
    },
  });
}

export function init() {
  leftViewer = new Cesium.Viewer("leftViewer", {
    animation: false,
    timeline: false,
  });
  rightViewer = new Cesium.Viewer("rightViewer", {
    animation: false,
    timeline: false,
  });

  const syncFromLeft = () => {
    if (activeViewer === leftViewer) {
      syncCamera(leftViewer, rightViewer);
    }
  };
  const syncFromRight = () => {
    if (activeViewer === rightViewer) {
      syncCamera(rightViewer, leftViewer);
    }
  };

  removeLeftPostRender =
    leftViewer.scene.postRender.addEventListener(syncFromLeft);
  removeRightPostRender =
    rightViewer.scene.postRender.addEventListener(syncFromRight);

  leftDom = leftViewer.container;
  rightDom = rightViewer.container;
  leftDom.addEventListener("mouseenter", handleLeftMouseEnter);
  rightDom.addEventListener("mouseenter", handleRightMouseEnter);
}

export function onUnmounted() {
  removeLeftPostRender?.();
  removeRightPostRender?.();
  leftDom?.removeEventListener("mouseenter", handleLeftMouseEnter);
  rightDom?.removeEventListener("mouseenter", handleRightMouseEnter);

  if (leftViewer && !leftViewer.isDestroyed()) leftViewer.destroy();
  if (rightViewer && !rightViewer.isDestroyed()) rightViewer.destroy();

  activeViewer = undefined;
  removeLeftPostRender = undefined;
  removeRightPostRender = undefined;
  leftDom = undefined;
  rightDom = undefined;
  leftViewer = undefined;
  rightViewer = undefined;
  viewer = undefined;
}

export function flyTo() {
  leftViewer?.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(112.722391, 26.774526, 755496),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
    duration: 2,
  });
}
