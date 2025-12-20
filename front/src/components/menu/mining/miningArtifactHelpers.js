/**
 * Helpers pour les artefacts du jeu de minage
 */

import { MINING_CONFIG } from '@/data/mining'

/**
 * Obtient les données d'un artefact
 * @param {string} artifactId - ID de l'artefact
 * @returns {Object|null}
 */
export function getArtifactData(artifactId) {
  if (!artifactId) return null

  // Tenter depuis le cache global (côté serveur)
  try {
    const serverData = typeof window !== 'undefined' && window.__gameDataCache?.artifacts
    if (serverData?.[artifactId]) {
      return serverData[artifactId]
    }
  } catch {
    // Ignore
  }

  // Fallback vers MINING_CONFIG
  try {
    if (MINING_CONFIG?.artifacts?.[artifactId]) {
      return MINING_CONFIG.artifacts[artifactId]
    }
  } catch {
    // Ignore
  }

  return null
}

/**
 * Obtient l'icône d'un artefact
 * @param {string} artifactId
 * @returns {string} Emoji
 */
export function getArtifactIcon(artifactId) {
  const data = getArtifactData(artifactId)
  return data?.icon || '❖'
}

/**
 * Obtient le nom d'un artefact
 * @param {string} artifactId
 * @returns {string}
 */
export function getArtifactName(artifactId) {
  if (!artifactId) return 'Vide'
  const data = getArtifactData(artifactId)
  return data?.name || artifactId
}

/**
 * Génère le tooltip d'un artefact
 * @param {string} artifactId
 * @returns {string} HTML
 */
export function getArtifactTooltip(artifactId) {
  if (!artifactId) {
    return '<div style="opacity:0.7;">Emplacement vide</div>'
  }

  const data = getArtifactData(artifactId)
  if (!data) {
    return '<div>Artefact inconnu</div>'
  }

  return `
    <div style="max-width: 250px;">
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">
        ${data.icon || '❖'} ${data.name}
      </div>
      <div style="font-size: 13px; line-height: 1.4; opacity: 0.95;">
        ${data.description || 'Aucune description'}
      </div>
    </div>
  `
}

/**
 * Calcule les modificateurs combinés des artefacts équipés
 * @param {Array<string>} equippedArtifacts - Liste des IDs d'artefacts équipés
 * @returns {Object} Modificateurs cumulés
 */
export function computeArtifactModifiers(equippedArtifacts) {
  const modifiers = {
    toolDamageAdd: 0,
    bonusRewardChance: 0,
    revealHints: 0,
  }

  if (!equippedArtifacts || !Array.isArray(equippedArtifacts)) {
    return modifiers
  }

  equippedArtifacts.forEach((artifactId) => {
    const data = getArtifactData(artifactId)
    if (!data?.effects) return

    Object.entries(data.effects).forEach(([key, value]) => {
      if (typeof value === 'number' && modifiers[key] !== undefined) {
        modifiers[key] += value
      }
    })
  })

  return modifiers
}

/**
 * Obtient le style de badge pour un artefact selon sa rareté
 * @param {string} artifactId
 * @returns {Object} Style CSS
 */
export function getArtifactBadgeStyle(artifactId) {
  const data = getArtifactData(artifactId)
  const rarity = data?.rarete || 'commune'

  const borderColors = {
    commune: 'rgba(194,194,194,0.55)',
    rare: 'rgba(123,192,255,0.45)',
    epique: 'rgba(201,139,255,0.44)',
    legendaire: 'rgba(212,175,55,0.7)',
  }

  const textColors = {
    commune: '#5c2c08',
    rare: '#0b4a66',
    epique: '#4b1e5a',
    legendaire: '#5c2c08',
  }

  const bgMap = {
    commune: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(194,194,194,0.08))',
    rare: 'linear-gradient(180deg, rgba(123,192,255,0.10), rgba(255,255,255,0.02))',
    epique: 'linear-gradient(180deg, rgba(201,139,255,0.10), rgba(255,255,255,0.02))',
    legendaire: 'linear-gradient(180deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))',
  }

  return {
    background: bgMap[rarity] || bgMap.commune,
    color: textColors[rarity] || textColors.commune,
    border: `2.5px solid ${borderColors[rarity] || borderColors.commune}`,
    boxShadow: 'inset 0 0 6px rgba(0,0,0,0.04)',
  }
}
