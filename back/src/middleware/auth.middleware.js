import jwt from 'jsonwebtoken'

const SECRET_KEY = process.env.JWT_SECRET || 'dev-secret'
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ ERREUR CRITIQUE: JWT_SECRET doit être défini en production!')
  }
  console.warn('⚠️  JWT_SECRET manquant. Utilisation d\'une clé par défaut pour le développement (middleware).')
}

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Token manquant' })

  const token = authHeader.split(' ')[1] // "Bearer <token>" => on prend le 2e morceau
  try {
    const decoded = jwt.verify(token, SECRET_KEY)
    req.userId = decoded.userId
    next()
  } catch (err) {
    res.status(403).json({ error: 'Token invalide' })
  }
}
