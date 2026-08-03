# CesiumExample

基于 Vue 3、Vite、Monaco Editor 和 Cesium 的在线示例项目。

## 开发与构建

```bash
pnpm install
pnpm dev
pnpm build
```

## 在线编辑器运行时

Cesium 由 npm 包通过 Vite 构建，不再从 `public/lib/Cesium/Cesium.js` 注入。编辑器代码在独立的 `runner.html` iframe 中以 ES Module 运行，每次点击“运行”都会先销毁上一次 Viewer，再创建新的运行环境。

示例代码可直接使用全局的 `Cesium`：

```js
export let viewer

export function onMounted() {
  viewer = new Cesium.Viewer("cesiumContainer")
}

export function onUnmounted() {
  if (viewer && !viewer.isDestroyed()) viewer.destroy()
  viewer = undefined
}
```

## 引入 Turf、Lodash 和 Cesium

在线编辑器支持以下标准 ES Module 写法。Runner 会把白名单中的裸包导入转换为带缓存的动态加载，库只会在示例实际运行时下载：

```js
import * as turf from "turf"
import * as lodash from "lodash"

export async function onMounted() {
  const point = turf.point([116.39, 39.9])
  const update = lodash.debounce(() => console.log(point), 100)
  update()
}
```

也支持命名导入和别名：

```js
import * as Cesium from "cesium"
import { point } from "@turf/turf"
import { debounce as delay } from "lodash-es"
```

当前支持的包名是 `cesium`、`turf`、`@turf/turf`、`lodash` 和 `lodash-es`。`await importLibrary("turf")` 仍可用于显式动态加载。需要新增库时，应先安装 npm 包，再在 `src/pages/runner/main.ts` 的加载器和别名白名单中注册。
