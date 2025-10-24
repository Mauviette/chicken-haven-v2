// utils/api.js
// Utilitaire pour les appels API avec gestion centralisée des URLs et authentification

const getApiBaseUrl = () => {
  // Si une URL d'API est définie explicitement dans l'environnement, l'utiliser
  const envApiUrl = import.meta.env.VITE_API_BASE_URL
  if (envApiUrl && envApiUrl.trim() !== '') {
    console.log('🔧 Using configured API URL:', envApiUrl)
    return envApiUrl
  }
  
  // Détection automatique pour le développement local
  const currentUrl = window.location
  const hostname = currentUrl.hostname
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const apiUrl = 'http://localhost:3002'
    console.log('📍 Detected localhost, using:', apiUrl)
    return apiUrl
  }
  
  // URL par défaut pour la production
  const defaultApiUrl = 'https://api.chicken-haven.fr'
  console.log('🔧 Using default API URL:', defaultApiUrl)
  return defaultApiUrl
}

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
        // Gérer seulement les vraies erreurs d'authentification (401)
        // 403 = Accès interdit mais token valide (ex: niveau insuffisant)
        if (response.status === 401) {
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
    // Gérer seulement les vraies erreurs d'authentification (401)
    // 403 = Accès interdit mais token valide (ex: niveau insuffisant)
    if (response.status === 401) {
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
      // Distinguer les erreurs d'auth (401) des erreurs d'autorisation (403)
      if (response.status === 401) {
        console.warn(`🔐 Auth error ${response.status} for ${endpoint}, token likely invalid`)
        throw new Error(`Authentication required`)
      } else if (response.status === 403) {
        console.warn(`🚫 Access forbidden ${response.status} for ${endpoint}, insufficient permissions`)
        throw new Error(`Access forbidden`)
      }
      
      const error = await response.clone().text()
      throw new Error(`API Error ${response.status}: ${error}`)
    }
    
    // Utiliser une copie pour éviter l'erreur "body stream already read" en cas de déduplication
    return response.clone().json()
  } catch (error) {
    // Log silencieux pour les erreurs d'auth et d'autorisation
    if (!error.message.includes('Authentication required') && !error.message.includes('Access forbidden')) {
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
