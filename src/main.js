import { createApp } from 'vue'
import { createPinia } from 'pinia' // Импортируем Pinia
import App from './App.vue'
import { vuetify } from './plugins/vuetify'
import router from './router' // Импортируем роутер

const app = createApp(App)
const pinia = createPinia()

app.use(pinia) // Подключаем
app.use(router) // Подключаем
app.use(vuetify)
app.mount('#app')