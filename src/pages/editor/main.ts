import { createApp } from "vue";
import Application from "./App.vue";
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './../../style.css'

createApp(Application).use(ElementPlus).mount('#root');
