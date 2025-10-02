// utils/mongoUtils.js
// Utilitaires pour gérer les conflits de version MongoDB/Mongoose

/**
 * Exécute une opération avec retry automatique en cas de conflit de version
 * @param {Function} operation - Fonction qui retourne une Promise et effectue l'opération
 * @param {number} maxRetries - Nombre maximum de tentatives (défaut: 3)
 * @param {string} operationName - Nom de l'opération pour les logs (défaut: 'Operation')
 * @returns {Promise} - Résultat de l'opération
 */
export async function executeWithRetry(operation, maxRetries = 3, operationName = 'Operation') {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      // Si c'est un conflit de version et qu'il reste des tentatives
      if (error.name === 'VersionError' && attempt < maxRetries) {
        console.log(`⚠️ Conflit de version détecté lors de ${operationName} (tentative ${attempt}/${maxRetries})`)
        
        // Attendre un délai exponentiel avant de retenter
        await new Promise(resolve => setTimeout(resolve, attempt * 100))
        continue
      }
      
      // Relancer l'erreur si ce n'est pas un VersionError ou si on a épuisé les tentatives
      throw error
    }
  }
}

/**
 * Sauvegarde un document Mongoose avec retry automatique
 * @param {Document} document - Document Mongoose à sauvegarder
 * @param {number} maxRetries - Nombre maximum de tentatives (défaut: 3)
 * @returns {Promise} - Document sauvegardé
 */
export async function saveWithRetry(document, maxRetries = 3) {
  return executeWithRetry(
    () => document.save(),
    maxRetries,
    `save document ${document.constructor.modelName}`
  )
}