import { createRouter, createWebHistory } from 'vue-router'
import Farm from '@/views/Farm.vue'
import Market from '@/views/Market.vue'

const routes = [
  { path: '/', name: 'Farm', component: Farm },
  { path: '/market', name: 'Market', component: Market },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
