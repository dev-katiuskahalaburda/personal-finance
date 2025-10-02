import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import AddTransaction from '@/views/AddTransaction.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/add-transaction',
    name: 'AddTransaction',
    component: AddTransaction
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router