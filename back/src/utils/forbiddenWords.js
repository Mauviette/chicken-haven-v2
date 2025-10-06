import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let forbiddenWords = []
let lastModified = 0

/**
 * Charge les mots interdits depuis le fichier forbidden-words.txt
 * Cache le résultat et recharge automatiquement si le fichier est modifié
 */
function loadForbiddenWords() {
  try {
    const filePath = path.join(__dirname, '../../../forbidden-words.txt')
    const stats = fs.statSync(filePath)
    
    // Recharger seulement si le fichier a été modifié
    if (stats.mtimeMs > lastModified) {
      const content = fs.readFileSync(filePath, 'utf-8')
      
      // Parser le fichier : une ligne par mot, ignorer les commentaires et lignes vides
      forbiddenWords = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(word => word.toLowerCase())
      
      lastModified = stats.mtimeMs
      console.log(`📝 Loaded ${forbiddenWords.length} forbidden words from forbidden-words.txt`)
    }
  } catch (error) {
    console.warn('⚠️ Could not load forbidden-words.txt, using fallback list:', error.message)
    
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
 * @returns {boolean} - true si le texte contient un mot interdit
 */
export function containsForbiddenWords(text) {
  const words = loadForbiddenWords()
  const lowerText = text.toLowerCase()
  return words.some(word => lowerText.includes(word))
}

/**
 * Retourne la liste des mots interdits (pour usage dans le frontend)
 * @returns {string[]} - Liste des mots interdits
 */
export function getForbiddenWordsList() {
  return loadForbiddenWords()
}