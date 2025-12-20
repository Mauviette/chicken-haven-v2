/**
 * Utilitaires de calcul des modificateurs d'artefacts pour le minage
 */
import { artifactsData } from '../../data/sharedGameData.js'

/**
 * Calcule les modificateurs appliqués par une liste d'artefacts équipés
 * @param {Array} equipped - Liste des IDs d'artefacts équipés
 * @returns {Object} - Objet contenant tous les modificateurs
 */
export function computeArtifactModifiers(equipped = []) {
  const modifiers = {
    extraRewardChance: 0, // ajout en probabilité absolue (ex: +0.05)
    rewardAmountPercent: 0, // somme en pourcentage (ex: 20 => +20%)
    toolDamageAdd: 0, // ajout plat aux dégâts d'outil (appliqué au centre)
    extraSlotsFromArtifacts: 0,
    // Effets d'outils
    extraToolCount: 0, // nombre d'outils supplémentaires à ajouter
    lastDynamite: false, // forcer le dernier outil à être une dynamite
    toolChanges: [], // list of { origin, dest } to map tool types
    duplicates: [], // list of { detect, add } pour dupliquer certains outils
    revealRewardsChance: 0, // probabilité cumulée de révéler des cases avec récompense
    chainDamage: 0, // dégâts supplémentaires aux cases adjacentes quand une case est brisée
    revealCrackedRewards: false, // révéler les cases avec récompenses fissurées
    fragileGrid: { chance: 0, damage: 0 } // chance et dégâts initiaux pour les cases
  }

  // Normaliser les entrées "equipped" : accepter string id ou objets { artifactId } / { id }
  const normalizedIds = normalizeArtifactIds(equipped)

  for (const id of normalizedIds) {
    const art = artifactsData[id]
    if (!art || !art.effect) continue
    applyArtifactEffect(modifiers, art.effect)
  }

  // DEBUG: lister les IDs normalisés et modificateurs calculés (utile pour diagnostics)
  try {
    console.debug('[mining] computeArtifactModifiers -> normalizedIds:', normalizedIds, 'modifiers:', modifiers)
  } catch (_) {}

  return modifiers
}

/**
 * Normalise les entrées d'artefacts en IDs simples
 * @param {Array} equipped - Liste mixte d'IDs ou d'objets
 * @returns {Array<string>} - Liste des IDs normalisés
 */
function normalizeArtifactIds(equipped) {
  return (Array.isArray(equipped) ? equipped : [])
    .map(item => {
      if (!item) return null
      if (typeof item === 'string') return item
      if (typeof item === 'object') return item.artifactId || item.id || null
      return null
    })
    .filter(Boolean)
}

/**
 * Applique un effet d'artefact aux modificateurs
 * @param {Object} modifiers - Objet des modificateurs à modifier
 * @param {Object} effect - L'effet de l'artefact
 */
function applyArtifactEffect(modifiers, effect) {
  const effectHandlers = {
    'increase_reward_chance': (e) => { modifiers.extraRewardChance += (e.amount || 0) },
    'increase_reward_amount_percent': (e) => { modifiers.rewardAmountPercent += (e.percent || 0) },
    'increase_tool_damage': (e) => { modifiers.toolDamageAdd += (e.amount || 0) },
    'add_artifact_slot': (e) => { modifiers.extraSlotsFromArtifacts += (e.amount || 0) },
    'increase_tool_count': (e) => { modifiers.extraToolCount += (e.amount || 0) },
    'last_dynamite': () => { modifiers.lastDynamite = true },
    'tool_change': (e) => { 
      if (e.origin && e.dest) modifiers.toolChanges.push({ origin: e.origin, dest: e.dest }) 
    },
    'when_tool_add_another': (e) => { 
      if (e.detect && e.add) modifiers.duplicates.push({ detect: e.detect, add: e.add }) 
    },
    'reveal_rewards': (e) => { modifiers.revealRewardsChance += (e.chance || 0) },
    'chain_damage': (e) => { modifiers.chainDamage = Math.max(modifiers.chainDamage, e.amount || 0) },
    'reveal_cracked_rewards': () => { modifiers.revealCrackedRewards = true },
    'fragile_grid': (e) => {
      modifiers.fragileGrid.chance = Math.max(modifiers.fragileGrid.chance, e.chance || 0)
      modifiers.fragileGrid.damage = Math.max(modifiers.fragileGrid.damage, e.damage || 0)
    }
  }

  const handler = effectHandlers[effect.type]
  if (handler) handler(effect)
}
