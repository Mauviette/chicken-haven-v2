import { apiGet } from './api.js'

let forbiddenWords = []
let lastFetched = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Récupère la liste des mots interdits depuis le serveur
 * Cache le résultat pendant 5 minutes
 */
async function loadForbiddenWords() {
  const now = Date.now()
  
  // Utiliser le cache si récent
  if (forbiddenWords.length > 0 && (now - lastFetched) < CACHE_DURATION) {
    return forbiddenWords
  }
  
  try {
    const response = await apiGet('/api/auth/forbidden-words')
    forbiddenWords = response.forbiddenWords || []
    lastFetched = now
  } catch (error) {
    console.warn('⚠️ Could not load forbidden words from server, using fallback:', error)
    
    // Liste de fallback en cas d'erreur
    forbiddenWords = [
      'admin', 'moderator', 'mod', 'bot', 'system', 'null', 'undefined', 'test',
      'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell', 'sex', 'porn',
      'nazi', 'hitler', 'terrorist', 'suicide', 'kill', 'death', 'murder'
    ]
  }
  
  return forbiddenWords
}

/**
 * Vérifie si un texte contient des mots interdits
 * @param {string} text - Le texte à vérifier
 * @returns {Promise<boolean>} - true si le texte contient un mot interdit
 */
export async function containsForbiddenWords(text) {
  const words = await loadForbiddenWords()
  const lowerText = text.toLowerCase()
  return words.some(word => lowerText.includes(word))
}

/**
 * Retourne la liste des mots interdits
 * @returns {Promise<string[]>} - Liste des mots interdits
 */
export async function getForbiddenWordsList() {
  return await loadForbiddenWords()
}