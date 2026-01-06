import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import cesium from 'vite-plugin-cesium';


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    cesium(),
    // * 使用 svg 图标
    createSvgIconsPlugin({
      iconDirs: [resolve(process.cwd(), "src/assets/svgs/")],
      symbolId: "icon-[name]",
    }),
    monacoEditorPlugin({}),
  ],
  optimizeDeps: {
    exclude: ['@vue/repl'],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
