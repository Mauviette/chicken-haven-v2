// utils/api.js
// Utilitaire pour les appels API avec gestion centralisée des URLs et authentification

const getApiBaseUrl = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'

// Déduplication des requêtes GET concurrentes (même URL + méthode + token)
const inFlight = new Map()
function getKey(url, method, token) {
  return `${method || 'GET'}::${token || ''}::${url}`
}

/**
 * Effectue un appel API avec l'URL de base configurée
 * @param {string} endpoint - Le chemin de l'endpoint (ex: '/api/poules')
 * @param {RequestInit & { _dedupeKey?: string }} options - Options fetch standard
 * @returns {Promise<Response>}
 */
export async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  
  // Si pas de token et endpoint protégé, rejeter immédiatement
  if (!token && endpoint.includes('/api/') && !endpoint.includes('/api/auth/') && !endpoint.includes('/api/game-data')) {
    console.warn('⚠️ API call rejected: no token for protected endpoint', endpoint)
    throw new Error('Non authentifié')
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const url = `${getApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
  const method = (options.method || 'GET').toUpperCase()

  // Dédupe uniquement les GET (POST/PUT/PATCH/DELETE potentiellement non idempotents)
  if (method === 'GET') {
    const key = options._dedupeKey || getKey(url, method, token)
    if (inFlight.has(key)) {
      return inFlight.get(key)
    }
    const p = fetch(url, { ...options, headers })
      .then(response => {
        // Gérer les erreurs d'authentification globalement
        if (response.status === 401 || response.status === 403) {
          console.warn('⚠️ Authentication error detected, clearing token')
          localStorage.removeItem('token')
        }
        return response
      })
      .finally(() => { inFlight.delete(key) })
    inFlight.set(key, p)
    return p
  }

  return fetch(url, {
    ...options,
    headers
  }).then(response => {
    // Gérer les erreurs d'authentification pour tous les types de requêtes
    if (response.status === 401 || response.status === 403) {
      console.warn('⚠️ Authentication error detected, clearing token')
      localStorage.removeItem('token')
    }
    return response
  })
}

/**
 * Effectue un appel API et parse automatiquement le JSON
 * @param {string} endpoint - Le chemin de l'endpoint
 * @param {RequestInit} options - Options fetch standard
 * @returns {Promise<any>}
 */
export async function apiCallJSON(endpoint, options = {}) {
  try {
    const response = await apiCall(endpoint, options)
    
    if (!response.ok) {
      // Ne pas lancer d'erreur pour les codes d'auth si on est déjà en train de gérer la déconnexion
      if (response.status === 401 || response.status === 403) {
        console.warn(`🔐 Auth error ${response.status} for ${endpoint}, token likely invalid`)
        throw new Error(`Authentication required`)
      }
      
      const error = await response.clone().text()
      throw new Error(`API Error ${response.status}: ${error}`)
    }
    
    // Utiliser une copie pour éviter l'erreur "body stream already read" en cas de déduplication
    return response.clone().json()
  } catch (error) {
    // Log silencieux pour les erreurs d'auth pendant la déconnexion
    if (!error.message.includes('Authentication required')) {
      console.error(`❌ API call failed for ${endpoint}:`, error.message)
    }
    throw error
  }
}

/**
 * GET request avec JSON parsing et protection auth
 */
export const apiGet = (endpoint) => {
  // Vérification simple côté client
  const token = localStorage.getItem('token')
  if (!token && endpoint.includes('/api/') && !endpoint.includes('/api/auth/') && !endpoint.includes('/api/game-data')) {
    return Promise.reject(new Error('Non authentifié'))
  }
  return apiCallJSON(endpoint, { method: 'GET' })
}

/**
 * POST request avec JSON parsing
 */
export const apiPost = (endpoint, data = null) => apiCallJSON(endpoint, {
  method: 'POST',
  body: data ? JSON.stringify(data) : null
})

/**
 * PUT request avec JSON parsing
 */
export const apiPut = (endpoint, data = null) => apiCallJSON(endpoint, {
  method: 'PUT',
  body: data ? JSON.stringify(data) : null
})

/**
 * PATCH request avec JSON parsing
 */
export const apiPatch = (endpoint, data = null) => apiCallJSON(endpoint, {
  method: 'PATCH',
  body: data ? JSON.stringify(data) : null
})

/**
 * DELETE request avec JSON parsing
 */
export const apiDelete = (endpoint) => apiCallJSON(endpoint, { method: 'DELETE' })
