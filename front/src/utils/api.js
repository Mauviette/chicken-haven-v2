// utils/api.js
// Utilitaire pour les appels API avec gestion centralisée des URLs et authentification

const getApiBaseUrl = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'

/**
 * Effectue un appel API avec l'URL de base configurée
 * @param {string} endpoint - Le chemin de l'endpoint (ex: '/api/poules')
 * @param {RequestInit} options - Options fetch standard
 * @returns {Promise<Response>}
 */
export async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const url = `${getApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
  
  return fetch(url, {
    ...options,
    headers
  })
}

/**
 * Effectue un appel API et parse automatiquement le JSON
 * @param {string} endpoint - Le chemin de l'endpoint
 * @param {RequestInit} options - Options fetch standard
 * @returns {Promise<any>}
 */
export async function apiCallJSON(endpoint, options = {}) {
  const response = await apiCall(endpoint, options)
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error ${response.status}: ${error}`)
  }
  
  return response.json()
}

/**
 * GET request avec JSON parsing
 */
export const apiGet = (endpoint) => apiCallJSON(endpoint, { method: 'GET' })

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
