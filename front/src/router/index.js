import { createRouter, createWebHistory } from 'vue-router'
import Production from '@/views/Production.vue'
import Market from '@/views/Market.vue'
import Collection from '@/views/Collection.vue'
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
  },
  {
    path: '/market',
    name: 'Marché',
    component: Market,
    meta: { requiresAuth: true }
  },
  {
    path: '/collection',
    name: 'Collection',
    component: Collection,
    meta: { requiresAuth: true }
  }
  ,
  // Catch-all: redirige toute route invalide vers une page valide selon l'état d'auth
  {
    path: '/:pathMatch(.*)*',
    redirect: () => {
      const { isLoggedIn } = useAuth()
      return isLoggedIn() ? '/production' : '/auth'
    }
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
