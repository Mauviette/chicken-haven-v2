/**
 * État réactif partagé des ressources du joueur
 * Ce fichier contient les refs singleton utilisées par tous les composables player
 */
import { ref, computed } from 'vue'

// Ressources
export const eggs = ref(0)
export const stockTokens = ref(0)
export const productionTokens = ref(0)
export const wildTokens = ref(0)
export const chestKeys = ref(0)
export const miningTokens = ref(0)
export const preciousStones = ref(0)
export const rottenTomatoes = ref(0)

// Équipe et artefacts
export const team = ref({ maxSlots: 3, slots: [] })
export const artifactSlots = ref({ slotsCount: 2, equipped: [] })

// Expérience
export const level = ref(1)
export const xp = ref(0)
export const xpRequired = ref(2)

// Joueur
export const player = ref(null)
export const cooldowns = ref({})

// Propriété calculée pour apocalypse
export const apocalypse = computed(() => player.value?.apocalypse || false)

/**
 * Réinitialise toutes les données du joueur
 */
export function clearPlayerData() {
  eggs.value = 0
  stockTokens.value = 0
  productionTokens.value = 0
  wildTokens.value = 0
  chestKeys.value = 0
  miningTokens.value = 0
  preciousStones.value = 0
  rottenTomatoes.value = 0
  player.value = null
  level.value = 1
  xp.value = 0
  xpRequired.value = 2
  team.value = { maxSlots: 3, slots: [] }
  artifactSlots.value = { slotsCount: 2, equipped: [] }
  cooldowns.value = {}
}

/**
 * Met à jour les ressources depuis un objet
 * @param {Object} resources - Objet contenant les ressources
 */
export function updateResources(resources) {
  if (!resources) return
  if (resources.eggs !== undefined) eggs.value = Number(resources.eggs)
  if (resources.stock_token !== undefined) stockTokens.value = Number(resources.stock_token)
  if (resources.production_token !== undefined) productionTokens.value = Number(resources.production_token)
  if (resources.wild_token !== undefined) wildTokens.value = Number(resources.wild_token)
  if (resources.chest_key !== undefined) chestKeys.value = Number(resources.chest_key)
  if (resources.mining_token !== undefined) miningTokens.value = Number(resources.mining_token)
  if (resources.precious_stone !== undefined) preciousStones.value = Number(resources.precious_stone)
  if (resources.rotten_tomato !== undefined) rottenTomatoes.value = Number(resources.rotten_tomato)
}
