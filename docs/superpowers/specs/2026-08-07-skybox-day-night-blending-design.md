# 多套近地天空盒昼夜融合设计

## 目标

在 `src/example/map/property/skybox-multiple` 示例中实现多套近地天空盒之间的平滑昼夜切换。切换既可以由按钮触发，也可以由 Cesium 时钟驱动。渲染期间地平线方向必须保持稳定，不允许通过频繁重建六张图片造成明显卡顿或纹理闪烁。

## 现状与约束

当前实现通过删除旧的 `Cesium.CubeMapPanorama` 并创建新实例来切换天空盒，因此只能瞬时换图。

Cesium 1.143 的 `CubeMapPanorama` 只采样一个 `samplerCube`。其片元着色器输出透明度来自 `czm_morphTime`，在 3D 模式下为不透明；图片自身 alpha 不作为可控混合权重。因此，叠加两个原生 `CubeMapPanorama` 只能发生覆盖，不能实现可靠的交叉淡化。

三套近地资源采用同一方向约定：

- `positiveX / negativeX`：Right / Left
- `positiveY / negativeY`：Front / Back
- `positiveZ / negativeZ`：Up / Down

天空盒方向继续使用 `Cesium.Transforms.eastNorthUpToFixedFrame` 生成的 ENU 旋转矩阵。

当前资源中没有带地平线的夜间近地天空盒。`public/img/skybox-milkyway` 可作为开发阶段的夜景占位资源，但正式效果需要补充与其他近地资源方向、曝光和地平线高度一致的夜间六面图。

## 方案选择

采用项目内自定义 `BlendedCubeMapPanorama`。它复用 Cesium 的环境渲染思路，但在一个 DrawCommand 中同时采样两套 cubemap，并通过统一的融合权重输出最终颜色。

不采用以下方案：

- 两个原生 `CubeMapPanorama` 叠加：没有可控 alpha，无法正确融合。
- Canvas 在 CPU 上逐帧混合六张图片：每帧都需要重新上传纹理，性能和稳定性较差。
- 后处理阶段混合：单次场景渲染只有一个天空结果，需要额外离屏渲染两次，复杂度高于专用环境 primitive。

## 组件设计

### BlendedCubeMapPanorama

新增文件：

`src/example/map/property/skybox-multiple/BlendedCubeMapPanorama.js`

职责：

- 异步加载并持有当前、目标两套 `Cesium.CubeMap`。
- 创建单个环境渲染 DrawCommand。
- 使用 ENU `Matrix3` 控制两套纹理的共同方向。
- 暴露 `blendFactor`，取值固定在 `[0, 1]`。
- 切换完成后把目标纹理提升为当前纹理。
- 销毁自身创建的 vertex array、shader program 和 cubemap。

公开接口：

```js
new BlendedCubeMapPanorama({
  context,
  sources,
  transform,
  show: true,
});

await panorama.transitionTo(targetSources);
panorama.blendFactor = 0.5;
panorama.completeTransition();
panorama.destroy();
```

`transitionTo` 只负责加载并设置目标纹理，不负责动画时间。重复切换时使用请求序号丢弃过期加载结果，避免较慢请求覆盖最新目标。

初次创建时只加载一套当前纹理，不播放从空画面开始的融合动画。

### 着色器

顶点着色器沿用 `CubeMapPanorama` 的方向变换逻辑。片元着色器包含两个 cubemap uniform 和一个融合权重：

```glsl
uniform samplerCube u_fromCubeMap;
uniform samplerCube u_toCubeMap;
uniform float u_blendFactor;

vec3 direction = normalize(v_texCoord);
vec3 fromColor = czm_gammaCorrect(
    czm_textureCube(u_fromCubeMap, direction)
).rgb;
vec3 toColor = czm_gammaCorrect(
    czm_textureCube(u_toCubeMap, direction)
).rgb;
float factor = smoothstep(0.0, 1.0, u_blendFactor);
out_FragColor = vec4(mix(fromColor, toColor, factor), 1.0);
```

当没有目标纹理时，`toCubeMap` 与 `fromCubeMap` 指向同一对象，保证渲染路径始终有效。

### map.js 控制层

`map.js` 维护：

- 天空盒资源注册表 `SKYBOX_SETS`。
- 唯一的 `BlendedCubeMapPanorama` 实例。
- 当前类型、目标类型和动画句柄。
- `transitionTo(type, duration)` 切换入口。
- 可选的 Cesium Clock 监听器。

按钮和时间规则都只调用 `transitionTo`，不直接操作底层纹理。

切换流程：

1. 校验目标类型；无活动切换时加载目标 cubemap，加载期间继续显示当前天空。
2. 目标加载完成后，从 `blendFactor = 0` 开始动画。
3. 每帧根据经过时间更新融合权重并调用 `scene.requestRender()`。
4. 达到 `1` 后完成切换，释放旧纹理并记录新的当前类型。
5. 如果存在排队目标，立即开始下一段切换。

同一目标的重复请求直接复用当前状态，不重新加载。

活动切换期间的连续请求遵循以下规则：

- 请求当前目标：忽略重复请求。
- 请求当前来源：交换 from/to，并从 `1 - blendFactor` 继续，实现无跳变反向动画。
- 请求第三套天空：不打断当前融合，只保留最新的第三套目标排队；当前融合完成后再开始下一段。

这个策略保证任意时刻 shader 只采样两套 cubemap，同时连续快速点击后的最终状态仍以最后一次有效选择为准。

## 昼夜状态模型

渲染器与时间规则解耦。时间规则只返回相邻两套天空盒和融合进度：

```js
{
  from: "night",
  to: "wanxia",
  factor: 0.35,
}
```

建议的默认时段：

- 00:00–05:00：night
- 05:00–07:00：night → wanxia
- 07:00–09:00：wanxia → qingtian
- 09:00–17:00：qingtian
- 17:00–19:00：qingtian → wanxia
- 19:00–21:00：wanxia → night
- 21:00–24:00：night

该规则仅为默认配置，按钮触发的固定时长切换与时钟驱动共享同一个渲染器。

`lantian` 继续作为可由按钮选择的另一套白天天空；资源注册表允许后续把它插入自动时间段，而无需修改渲染器。

## 错误处理与生命周期

- 任意一面加载失败时保留当前天空盒，并向调用方抛出包含目标类型的错误。
- 目标资源六个面必须全部存在、类型一致、尺寸一致。
- `onUnmounted` 取消动画、移除 clock 监听器、从 primitives 中移除实例并调用 `destroy()`。
- 切换到 `none` 时销毁自定义实例，并恢复原有 `skyBox`、`skyAtmosphere`、太阳和月亮显示状态。
- 禁止修改 `node_modules/cesium`；自定义实现完全位于示例目录中。

## 测试与验收

自动测试覆盖：

- `blendFactor` 被限制在 `[0, 1]`。
- `transitionTo` 加载目标后不会提前释放当前 cubemap。
- `completeTransition` 正确提升目标并释放旧纹理。
- 重复目标不会重复加载。
- 较旧的异步加载结果不能覆盖较新的切换请求。
- `destroy` 释放所有自建 WebGL 资源且可重复安全调用。
- 时间规则在日出、白天、日落、夜晚边界返回正确状态。

人工验收：

- 晴天、晚霞、夜晚之间无瞬时闪黑。
- 转动相机时六面接缝和地平线保持稳定。
- 动画过程中地形、实体和界面正常渲染。
- 连续快速点击不同天空盒后最终状态与最后一次选择一致。
- 页面卸载后没有遗留动画、时钟监听器或 WebGL 资源。

## 非目标

- 不生成新的夜间天空盒图片。
- 不在本次实现中联动太阳光照、阴影、雾效和地表材质颜色。
- 不修改 Cesium 源码或全局渲染管线。
