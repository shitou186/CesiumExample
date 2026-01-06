# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

# vite-plugin-monaco-editor Error
因为vite3再创建项目的时候会自动的给package.json 加上 type = module 导致的报错
error when starting dev server:
TypeError: monacoEditorPlugin is not a function​
将 package.json 中 type=module 删除即可
type = module