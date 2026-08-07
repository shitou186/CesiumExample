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
    contextOptions: {
      webgl: {
        alpha: true,
      },
    },
  });
  flyTo();
  add3dtiles();
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
  viewer = undefined;
}

//  center: { lat: 31.795863, lng: 117.212909, alt: 2113, heading: 25, pitch: -34 }
export function flyTo() {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(117.212909, 31.795863, 2113),
    orientation: {
      heading: Cesium.Math.toRadians(25), // 朝北（0 弧度）
      pitch: Cesium.Math.toRadians(-34), // 向下俯视 30 度
      roll: 0, // 不滚动
    },
    duration: 0,
  });
}

async function add3dtiles() {
  // //data.mars3d.cn/3dtiles/jzw-hefei/tileset.json

  const url = "//data.mars3d.cn/3dtiles/jzw-hefei/tileset.json";
  // const url = "http://192.168.99.14:8010/shape/diff-yuhu/tileset.json";
  const tileset = await Cesium.Cesium3DTileset.fromUrl(url);
  // 将 tileset 添加到场景中
  viewer.scene.primitives.add(tileset);
  // 飞行到 3D Tiles 位置
  // await viewer.flyTo(tileset, {
  //   duration: 2, // 飞行时间（秒）
  //   offset: new Cesium.HeadingPitchRange(
  //     0, // 航向角
  //     Cesium.Math.toRadians(-45), // 俯仰角（向下看）
  //     tileset.boundingSphere.radius * 2, // 相机距离
  //   ),
  // });
}

// 河流面状
// /data.mars3d.cn/file/geojson/hefei-water.json
// 道路线
// /data.mars3d.cn/file/geojson/hefei-road.json

// 添加蒙版
function maskDiv() {
  const maskDiv = document.createElement("div");
  maskDiv.style.cssText = `
      position: absolute;
      top:0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999;
      background-image:
      radial-gradient(rgba(139, 138, 138, 0.219) 50%, rgba(65, 57, 57, 0.658) 70%, rgba(17, 16, 16, 1) 90%);
      `;
  document.body.appendChild(maskDiv);
}

// 纯渐变色
function customShader1(tileset) {
  const customShader = new Cesium.CustomShader({
    //片元着色器
    fragmentShaderText: `
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
          vec3 positionMC = fsInput.attributes.positionMC;
          material.diffuse = vec3(0.0, 1.0-positionMC.y*0.005, 1.0-positionMC.y*0.0015);
      }`,
  });
  tileset.customShader = customShader;
}

// 纯渐变色+动态光圈
function customShader2(tileset) {
  const customShader = new Cesium.CustomShader({
    //片元着色器
    fragmentShaderText: `
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
          vec3 positionMC = fsInput.attributes.positionMC;
          material.diffuse = vec3(0.0, 1.0-positionMC.y*0.005, 1.0-positionMC.y*0.0015);

          float _baseHeight = 18.0; // 物体的基础高度，需要修改成一个合适的建筑基础高度
          float _heightRange = 60.0; // 高亮的范围(_baseHeight ~ _baseHeight + _heightRange) 默认是 0-60米
          float _glowRange = 120.0; // 光环的移动范围(高度)

          float vtxf_height = fsInput.attributes.positionMC.y - _baseHeight;
          float vtxf_a11 = fract(czm_frameNumber / 360.0) * 3.14159265 * 2.0; //此处括号内分母为移动速度
          float vtxf_a12 = vtxf_height / _heightRange + sin(vtxf_a11) * 0.1;
          material.diffuse *= vec3(vtxf_a12, vtxf_a12, vtxf_a12);

          float vtxf_a13 = fract(czm_frameNumber / 360.0); //此处括号内分母为移动速度，数值越大，速度越慢
          float vtxf_h = clamp(vtxf_height / _glowRange, 0.0, 1.0);
          vtxf_a13 = abs(vtxf_a13 - 0.5) * 2.0;
          float vtxf_diff = step(0.01, abs(vtxf_h - vtxf_a13)); // 0.1 为高亮光条的范围（粗细）
          material.diffuse += material.diffuse * (1.0 - vtxf_diff);
      }`,
  });
  tileset.customShader = customShader;
}
