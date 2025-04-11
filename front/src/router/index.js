import { createRouter, createWebHistory } from 'vue-router'
import Farm from '@/views/Farm.vue'
import Market from '@/views/Market.vue'
import Auth from '@/views/AuthView.vue'
import { useAuth } from '@/composables/useAuth'

const routes = [
  {
    path: '/',
    redirect: () => {
      const { isLoggedIn } = useAuth()
      return isLoggedIn() ? '/farm' : '/auth'
    }
  },
  {
    path: '/auth',
    name: 'Auth',
    component: Auth
  },
  {
    path: '/farm',
    name: 'Farm',
    component: Farm,
    meta: { requiresAuth: true }
  },
  {
    path: '/market',
    name: 'Market',
    component: Market,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 🛡️ Garde globale : bloque l’accès aux pages protégées
router.beforeEach((to, from, next) => {
  const { isLoggedIn } = useAuth()
  if (to.meta.requiresAuth && !isLoggedIn()) {
    next('/auth')
  } else {
    next()
  }
})

export default router
