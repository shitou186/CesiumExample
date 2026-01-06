import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import './style.css'
import App from './App.vue'

import * as Icons from "@element-plus/icons-vue";
// svg icons
import "virtual:svg-icons-register";

const app = createApp(App)
// 注册element Icons组件
	Object.keys(Icons).forEach(key => {
		app.component(key, Icons[key as keyof typeof Icons]);
	});

app.use(ElementPlus).mount('#app')
