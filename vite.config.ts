import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import cesium from 'vite-plugin-cesium';


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    cesium({ rebuildCesium: true }),
    // * 使用 svg 图标
    createSvgIconsPlugin({
      iconDirs: [resolve(process.cwd(), "src/assets/svgs/")],
      symbolId: "icon-[name]",
    }),
  ],
  optimizeDeps: {
    exclude: ['@vue/repl'],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(process.cwd(), "index.html"),
        editor: resolve(process.cwd(), "editor-vue.html"),
        runner: resolve(process.cwd(), "runner.html"),
      },
    },
  },
});
