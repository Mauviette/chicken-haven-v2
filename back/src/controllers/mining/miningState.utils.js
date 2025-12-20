/**
 * Utilitaires de vérification d'état de minage
 */
import User from '../../models/User.js'

/**
 * Vérifie si un utilisateur a une partie de minage active
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<boolean>} - true si une partie est active
 */
export async function isUserMining(userId) {
  try {
    const user = await User.findById(userId).select('miningGame')
    if (!user) return false
    return !!(user.miningGame && user.miningGame.active)
  } catch (err) {
    console.warn('isUserMining error for', userId, err)
    return false
  }
}

/**
 * Assert helper à appeler avant d'autoriser equip/unequip d'artefacts côté serveur.
 * Lance une erreur (Error) si l'utilisateur a une partie de minage active.
 * Le controller d'équipement doit attraper cette erreur et renvoyer un 400/409 approprié.
 * @param {string} userId - ID de l'utilisateur
 * @throws {Error} - Si l'utilisateur est en train de miner
 */
export async function assertUserCanModifyArtifacts(userId) {
  const active = await isUserMining(userId)
  if (active) {
    const e = new Error('Impossible de modifier les artefacts pendant une partie de minage active')
    e.code = 'MINING_ACTIVE'
    throw e
  }
  return true
}

/**
 * Middleware Express réutilisable pour vérifier si l'utilisateur peut modifier ses artefacts
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next
 */
export function checkCanModifyArtifactsMiddleware(req, res, next) {
  ;(async () => {
    try {
      const userId = req.userId || (req.user && req.user._id)
      if (!userId) return res.status(401).json({ error: 'Non authentifié' })
      const active = await isUserMining(userId)
      if (active) {
        return res.status(409).json({ error: 'Impossible de modifier les artefacts pendant une partie de minage active' })
      }
      next()
    } catch (err) {
      console.error('checkCanModifyArtifactsMiddleware error:', err)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  })()
}
