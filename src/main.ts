import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import 'animate.css';

const app = createApp(App)

app.use(createPinia())
    .use(Antd)
    .mount('#app')
