import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Import your existing Firebase service (adapted for Vue)
import { auth } from './services/firebase'

const app = createApp(App)
app.use(router)
app.mount('#vue-app')