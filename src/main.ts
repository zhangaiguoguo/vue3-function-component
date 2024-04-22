import * as vue from 'vue';

const {createApp} = vue


import './style.css'
// @ts-ignore
import App from './App.vue'

const app = createApp(App)
app.mount('#app')