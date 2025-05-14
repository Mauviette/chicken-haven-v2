import { createRouter, createWebHistory } from 'vue-router'
import Production from '@/views/Production.vue'
import Auth from '@/views/AuthView.vue'
import { useAuth } from '@/composables/useAuth'

const routes = [
  {
    path: '/',
    redirect: () => {
      const { isLoggedIn } = useAuth()
      return isLoggedIn() ? '/production' : '/auth'
    }
  },
  {
    path: '/auth',
    name: 'Auth',
    component: Auth
  },
  {
    path: '/production',
    name: 'Production',
    component: Production,
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
