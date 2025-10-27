<template>
  <div class="market-view">
    <div class="header-bar">
      <h2 class="section-title">🛒 Marché</h2>
      <div class="player-balance">
      <Tooltip :text="stockTokenTooltip" position="bottom">
        <div class="balance-item">
          <span class="balance-icon">🧺</span>
          <span class="balance-amount">{{ stockTokens }}</span>
        </div>
      </Tooltip>
      <Tooltip :text="productionTokenTooltip" position="bottom">
        <div class="balance-item">
          <span class="balance-icon">⚙️</span>
          <span class="balance-amount">{{ productionTokens }}</span>
        </div>
      </Tooltip>
      <Tooltip v-if="getLevel() >= 5" :text="chestKeyTooltip" position="bottom">
        <div class="balance-item">
          <span class="balance-icon">🗝️</span>
          <span class="balance-amount">{{ chestKeys }}</span>
        </div>
      </Tooltip>
      <Tooltip v-if="getLevel() >= 5" :text="preciousStoneTooltip" position="bottom">
        <div class="balance-item">
          <span class="balance-icon">💎</span>
          <span class="balance-amount">{{ preciousStones }}</span>
        </div>
      </Tooltip>
      </div>
    </div>

    <!-- Onglets du marché -->
    <div class="market-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="switchTab(tab.id)"
      >
        <span class="tab-label">{{ tab.icon }} {{ tab.name }}</span>
        <span
          v-if="tab.id === 'upgrades' && hasAvailableUpgrade"
          class="badge-dot badge-dot--yellow tab-badge"
          title="Amélioration disponible"
        ></span>
      </button>

    </div>

    <!-- Contenu des onglets -->
    <div class="market-content">
      <!-- Onglet Boîtes -->
      <div v-if="activeTab === 'boxes'" class="market-section">
        <div class="section-header">
          <h3>🧰 Boîtes de Poules</h3>
          <p class="section-description">Obtenez de nouvelles poules en ouvrant des boîtes mystères !</p>
        </div>
        
        <div class="market-grid">
          <div 
            v-for="box in boxOffers" 
            :key="box.id"
            class="market-item box-item"
            :class="{ 'locked': (box.unlock_level && getLevel() < box.unlock_level) }"
          >
            <div v-if="box.unlock_level && getLevel() < box.unlock_level" class="locked-overlay">
              <div class="locked-content">🔒 Débloqué au niveau {{ box.unlock_level }}</div>
            </div>
            <div class="box-counter" v-if="!isBoxLocked(box)">
              <Tooltip :text="getBoxTooltipText(box)">
                <div class="counter-badge">
                  {{ getBoxChickenStats(box).ownedCount }}/{{ getBoxChickenStats(box).totalCount }}
                </div>
              </Tooltip>
            </div>
            <div class="dice-counter" v-if="!isBoxLocked(box)">
              <Tooltip :text="getDiceTooltipText(box)">
                <div class="dice-badge">
                  🎲
                </div>
              </Tooltip>
            </div>
            <div class="box-icon-container">
              <div class="box-icon">{{ isBoxLocked(box) ? '❓' : box.icon }}</div>
            </div>
            <div class="item-info">
              <h4 class="item-name">{{ isBoxLocked(box) ? 'Boîte mystère' : box.name }}</h4>
              <div class="box-contents" v-if="!isBoxLocked(box)">
                <div class="drop-groups">
                  <div v-for="group in box.dropGroups" :key="group.name" class="drop-group">
                    <span class="group-label">{{ getGroupDescription(group.name) }} ({{ Math.round(group.chance * 10) / 10 }}%)</span>
                    <span class="group-quantity" v-if="group.quantity > 1">x{{ group.quantity }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="item-purchase item-purchase-big">
              <BuyButton
                :price="box.price"
                :onClick="() => openBox(box)"
                :disabled="(box.unlock_level && getLevel() < box.unlock_level) || !canAfford(box.price)"
              >
                Ouvrir
              </BuyButton>
              <BuyButton
                :price="getBulkPrice(box.price, bulkOpenCount10)"
                :onClick="() => openBoxMultiple(box, bulkOpenCount10)"
                :disabled="(box.unlock_level && getLevel() < box.unlock_level) || !canAfford(getBulkPrice(box.price, bulkOpenCount10))"
              >
                Ouvrir x10
              </BuyButton>
              <BuyButton
                v-if="bulkOpenCount100"
                :price="getBulkPrice(box.price, bulkOpenCount100)"
                :onClick="() => openBoxMultiple(box, bulkOpenCount100)"
                :disabled="(box.unlock_level && getLevel() < box.unlock_level) || !canAfford(getBulkPrice(box.price, bulkOpenCount100))"
              >
                Ouvrir x100
              </BuyButton>
            </div>
          </div>
        </div>

        <!-- Sous-section Coffres de Trésors (visible à partir du niveau 5) -->
        <div v-if="getLevel() >= 5 && artifactBoxes.length > 0" style="margin-top: 40px;">
          <div class="section-header">
            <h3>🗝️ Coffres de Trésors</h3>
            <p class="section-description">Découvrez des artefacts de minage pour améliorer vos expéditions souterraines !</p>
          </div>
          
          <div class="market-grid">
            <div 
              v-for="box in artifactBoxes" 
              :key="box.id"
              class="market-item box-item"
              :class="{ 'locked': (box.unlock_level && getLevel() < box.unlock_level) }"
            >
              <div v-if="box.unlock_level && getLevel() < box.unlock_level" class="locked-overlay">
                <div class="locked-content">🔒 Débloqué au niveau {{ box.unlock_level }}</div>
              </div>
              <div class="dice-counter" v-if="!isBoxLocked(box)">
                <Tooltip :text="getDiceTooltipText(box)">
                  <div class="dice-badge">
                    🎲
                  </div>
                </Tooltip>
              </div>
              <div class="box-icon-container">
                <div class="box-icon">{{ isBoxLocked(box) ? '❓' : box.icon }}</div>
              </div>
              <div class="item-info">
                <h4 class="item-name">{{ isBoxLocked(box) ? 'Boîte mystère' : box.name }}</h4>
                <div class="box-contents" v-if="!isBoxLocked(box)">
                  <div class="drop-groups">
                    <div v-for="group in box.dropGroups" :key="group.name" class="drop-group">
                      <span class="group-label">{{ getGroupDescription(group.name) }} ({{ Math.round(group.chance * 10) / 10 }}%)</span>
                      <span class="group-quantity" v-if="group.quantity > 1">x{{ group.quantity }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="item-purchase item-purchase-big">
                <BuyButton
                  :price="box.price"
                  :onClick="() => openBox(box)"
                  :disabled="(box.unlock_level && getLevel() < box.unlock_level) || !canAfford(box.price)"
                >
                  Ouvrir
                </BuyButton>
                <BuyButton
                  :price="getBulkPrice(box.price, bulkOpenCount10)"
                  :onClick="() => openBoxMultiple(box, bulkOpenCount10)"
                  :disabled="(box.unlock_level && getLevel() < box.unlock_level) || !canAfford(getBulkPrice(box.price, bulkOpenCount10))"
                >
                  Ouvrir x10
                </BuyButton>
                <BuyButton
                  v-if="bulkOpenCount100"
                  :price="getBulkPrice(box.price, bulkOpenCount100)"
                  :onClick="() => openBoxMultiple(box, bulkOpenCount100)"
                  :disabled="(box.unlock_level && getLevel() < box.unlock_level) || !canAfford(getBulkPrice(box.price, bulkOpenCount100))"
                >
                  Ouvrir x100
                </BuyButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Onglet Améliorations -->
      <div v-if="activeTab === 'upgrades'" class="market-section">
        <div class="section-header">
          <h3>⚙️ Améliorations</h3>
          <p class="section-description">Améliorez votre ferme et vos capacités de production !</p>
        </div>
        
        <div class="market-grid">
          <div 
            v-for="upgrade in upgradeOffers" 
            :key="upgrade.id"
            class="market-item upgrade-item"
          >
            <div class="upgrade-icon">
              {{ upgrade.icon }}
            </div>
            <div class="item-info">
              <h4 class="item-name">{{ upgrade.name }}</h4>
              <div class="upgrade-level">
                <span class="level-text">{{ upgrade.displayLevel }}</span>
              </div>
              <div class="upgrade-effect">
                <span class="effect-text">{{ upgrade.effect }}</span>
              </div>
            </div>
            <div class="item-purchase">
              <BuyButton
                :price="upgrade.price"
                :onClick="() => buyUpgrade(upgrade)"
                :disabled="!canAfford(upgrade.price)"
              >
                Acheter
              </BuyButton>
            </div>
          </div>
        </div>

        <!-- Sous-section Agrandissement -->
        <div class="subsection-header">
          <h4>🏗️ Agrandissement</h4>
          <p class="subsection-description">Augmentez la taille de votre équipe et de vos emplacements d'artéfacts !</p>
        </div>
        
        <div class="market-grid">
          <div 
            v-for="expansion in expansionOffers" 
            :key="expansion.id"
            class="market-item expansion-item"
            :class="{ 'purchased': !expansion.canUpgrade }"
          >
            <div class="expansion-icon">
              {{ expansion.icon }}
            </div>
            <div class="item-info">
              <h4 class="item-name">{{ expansion.name }}</h4>
              <div class="expansion-description">
                <span class="description-text">{{ expansion.description }}</span>
              </div>
              <div class="expansion-effect">
                <span class="effect-text">{{ expansion.effect }}</span>
              </div>
            </div>
            <div class="item-purchase">
              <BuyButton
                :price="expansion.cost"
                :onClick="() => buyExpansionOffer(expansion)"
                :disabled="!expansion.canBuy"
              >
                {{ expansion.canUpgrade ? 'Améliorer' : 'Max atteint' }}
              </BuyButton>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Popup des résultats de boîte -->
    <BoxOpenAnimation :show="showOpenAnim" :icon="currentBoxIcon" label="Ouverture de la boîte…" />
    <BoxResults
      :showResults="showBoxResults"
      :results="boxResults"
      :boxName="lastOpenedBoxName"
      @close="closeBoxResults"
    />
    
    <br/>
    <br/>
    <br/>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayer } from '@/composables/usePlayer'
import { useEgg } from '@/composables/useEgg'
import { usePoules } from '@/composables/usePoules'
import { useGameData } from '@/composables/useGameData'
import { useBoxes } from '@/composables/useBoxes'
import { useAchievements } from '@/composables/useAchievements'
import { useArtifacts } from '@/composables/useArtifacts'
import { useExpansions } from '@/composables/useExpansions'
import { useSound } from '@/composables/useSound'
import ActionButton from '@/components/menu/ActionButton.vue'
import BuyButton from '@/components/menu/BuyButton.vue'
import { apiGet, apiPost } from '@/utils/api.js'

import BoxResults from '@/components/menu/BoxResults.vue'
import { boxesData } from '@/data/boxes.js'
import Tooltip from '@/components/menu/Tooltip.vue'
import BoxOpenAnimation from '@/components/menu/BoxOpenAnimation.vue'

const { eggs: playerEggs, stockTokens, productionTokens, wildTokens, chestKeys, preciousStones, canAfford, spendTokens, refreshPlayerData, getLevel } = usePlayer()
const { fetchEggStatus } = useEgg()
const { poules, refreshPoules } = usePoules()
const { loading: boxLoading, openBox: openBoxAPI, openBoxMultiple: openBoxMultipleAPI, getAvailableBoxes } = useBoxes()
const { checkAchievements } = useAchievements()
const { artifacts: ownedArtifacts, fetchArtifacts } = useArtifacts()
const { especies: especeData, boxes: gameBoxes, levelUnlocks, upgrades: serverUpgrades, expansions: expansionsData, groupes, artifacts: artifactsData, items } = useGameData()
const { expansionLevels, loading: expansionsLoading, fetchExpansionLevels, buyExpansion, getExpansionLevel, getNextExpansionLevel, canUpgradeExpansion, getExpansionCost, getExpansionReward } = useExpansions()
const router = useRouter()
const { click, open: sndOpen, close: sndClose, confirm: sndConfirm, boxOpen: sndBoxOpen, boxResults: sndBoxResults, legendaryDrop: sndLegend, epicDrop: sndEpic } = useSound()

// Données des items depuis le backend
const itemsData = computed(() => items.value)

// État des onglets
const activeTab = ref('boxes')
function switchTab(id) {
  if (activeTab.value !== id) {
    click()
    activeTab.value = id
  }
}

// Nombre d'ouvertures multiples selon le niveau
const bulkOpenCount10 = 10
const bulkOpenCount100 = computed(() => getLevel() >= 10 ? 100 : null)

// État des popups
const showBoxResults = ref(false)
const boxResults = ref([])
const lastOpenedBoxName = ref('')

// Boîtes disponibles depuis l'API
const availableBoxes = ref([])
const showOpenAnim = ref(false)
const currentBoxIcon = ref('📦')

// Niveaux d'améliorations
const upgradeLevels = ref({})
const upgradesVersion = ref(0)

// Animation d'achat d'amélioration (supprimée)

// Configuration des onglets
const tabs = computed(() => {
  return [
    { id: 'boxes', name: 'Boîtes', icon: '🧰' },
    { id: 'upgrades', name: 'Améliorations', icon: '⚙️' }
  ]
})

// Données des boîtes: fusionne la source jeu (toutes les boîtes) avec l'API (celles dispo)
const allBoxes = computed(() => {
  const all = (gameBoxes?.value && gameBoxes.value.length) ? gameBoxes.value : boxesData
  const avail = Array.isArray(availableBoxes.value) ? availableBoxes.value : []
  if (avail.length === 0) return all
  const map = new Map(avail.map(b => [b.id, b]))
  const merged = all.map(b => ({ ...b, ...(map.get(b.id) || {}) }))
  // Ajoute toute box inconnue côté jeu remontée par l'API (par sécurité)
  for (const b of avail) {
    if (!merged.find(x => x.id === b.id)) merged.push(b)
  }
  return merged
})

// Boîtes de poules traditionnelles
const boxOffers = computed(() => {
  return allBoxes.value.filter(box => box.category !== 'artifacts')
})

// Boîtes d'artefacts
const artifactBoxes = computed(() => {
  return allBoxes.value.filter(box => box.category === 'artifacts')
})

// Poules débloquées (uniquement les poules obtenues par le joueur)
const unlockedChickens = computed(() => {
  const ownedChickens = poules.value
    .filter(poule => poule.owned)
    .map(poule => poule.especeId)
  
  return ownedChickens
})

// Helper: savoir si une boîte est verrouillée au niveau actuel
function isBoxLocked(box) {
  return !!(box.unlock_level && getLevel() < box.unlock_level)
}

// Fonction pour calculer les statistiques des poules d'une boîte
function getBoxChickenStats(box) {
  const allPossibleChickens = []
  
  // Récupérer toutes les poules possibles de tous les groupes
  box.dropGroups.forEach(group => {
    const groupChickens = Object.keys(especeData.value)
      .filter(id => especeData.value[id].groupe === group.name)
    allPossibleChickens.push(...groupChickens)
  })
  
  // Supprimer les doublons
  const uniqueChickens = [...new Set(allPossibleChickens)]
  
  // Séparer les poules obtenues et non obtenues
  const ownedChickens = uniqueChickens.filter(id => unlockedChickens.value.includes(id))
  const notOwnedChickens = uniqueChickens.filter(id => !unlockedChickens.value.includes(id))
  
  return {
    owned: ownedChickens,
    notOwned: notOwnedChickens,
    ownedCount: ownedChickens.length,
    totalCount: uniqueChickens.length
  }
}

// Fonction pour obtenir la couleur CSS basée sur la rareté
function getRarityColor(rarity) {
  switch(rarity) {
    case 'commune': return '#95a5a6'
    case 'rare': return '#3498db'
    case 'epique': return '#9b59b6'
    case 'legendaire': return '#f39c12'
    default: return '#6d3c00'
  }
}

// Fonction pour récupérer la description d'un groupe depuis les données synchronisées
function getGroupDescription(groupName) {
  const group = groupes.value?.find(g => g.name === groupName)
  return group ? group.description : groupName
}

// Fonction pour trier par rareté
function getRarityOrder(rarity) {
  const order = { 'commune': 1, 'rare': 2, 'epique': 3, 'legendaire': 4 }
  return order[rarity] || 0
}

// Fonction pour générer le texte du tooltip des boîtes
function getBoxTooltipText(box) {
  const allPossibleChickens = []
  
  // Récupérer toutes les poules possibles de tous les groupes
  box.dropGroups.forEach(group => {
    const groupChickens = Object.keys(especeData.value)
      .filter(id => especeData.value[id].groupe === group.name)
    allPossibleChickens.push(...groupChickens)
  })
  
  // Supprimer les doublons
  const uniqueChickens = [...new Set(allPossibleChickens)]
  
  // Trier par rareté puis par nom
  const sortedChickens = uniqueChickens.sort((a, b) => {
    const rarityA = especeData.value[a]?.rarete || 'commune'
    const rarityB = especeData.value[b]?.rarete || 'commune'
    const orderDiff = getRarityOrder(rarityA) - getRarityOrder(rarityB)
    if (orderDiff !== 0) return orderDiff
    return (especeData.value[a]?.nom || '').localeCompare(especeData.value[b]?.nom || '')
  })
  
  // Créer la liste avec les noms colorés ou ??? pour les non obtenues
  const chickenList = sortedChickens.map(id => {
    const chicken = especeData.value[id]
    const color = getRarityColor(chicken?.rarete)
    
    if (unlockedChickens.value.includes(id)) {
      return `<span style="color: ${color}; font-weight: bold;">${chicken?.nom}</span>`
    } else {
      return `<span style="color: ${color};">???</span>`
    }
  })
  
  return chickenList.join(', ')
}

// Fonction pour calculer les probabilités moyennes de drop par rareté
function getBoxRarityProbabilities(box) {
  const totalChance = box.dropGroups.reduce((sum, group) => sum + group.chance, 0)
  let avgProbabilities = [0, 0, 0, 0] // [commune, rare, épique, légendaire]
  
  box.dropGroups.forEach(group => {
    const groupData = groupes.value?.find(g => g.name === group.name)
    if (groupData && groupData.rarityDropChance) {
      const weight = group.chance / totalChance
      groupData.rarityDropChance.forEach((prob, index) => {
        avgProbabilities[index] += prob * weight
      })
    }
  })
  
  return avgProbabilities.map(prob => {
    // Arrondir à 1 décimale maximum pour éviter les erreurs de précision
    return Math.round(prob * 10) / 10
  })
}

// Fonction pour compter les éléments disponibles par rareté
function getAvailableCountByRarity(groupName) {
  const rarities = ['commune', 'rare', 'epique', 'legendaire']
  const counts = [0, 0, 0, 0]
  
  if (groupName === 'artifacts') {
    // Pour les artefacts, utiliser les données du jeu et la liste des artefacts possédés
    // Créer un Set des IDs possédés pour une recherche rapide
    const ownedArtifactIds = new Set(ownedArtifacts.value.map(a => a.artifactId))
    
    // Parcourir tous les artefacts du jeu
    Object.values(artifactsData.value || {}).forEach(artifact => {
      const rarityIndex = rarities.indexOf(artifact.rarete || 'commune')
      if (rarityIndex !== -1 && !ownedArtifactIds.has(artifact.id)) {
        counts[rarityIndex]++
      }
    })
  } else {
    // Pour les poules, compter TOUTES les poules du groupe par rareté (pas seulement les non possédées)
    Object.entries(especeData.value || {}).forEach(([id, chicken]) => {
      if (chicken.groupe === groupName) {
        const rarityIndex = rarities.indexOf(chicken.rarete || 'commune')
        if (rarityIndex !== -1) {
          counts[rarityIndex]++
        }
      }
    })
  }
  
  return counts
}

// Fonction pour générer le texte du tooltip du dé
function getDiceTooltipText(box) {
  const totalChance = box.dropGroups.reduce((sum, group) => sum + group.chance, 0)
  const rarities = ['Commune', 'Rare', 'Épique', 'Légendaire']
  const colors = ['#95a5a6', '#3498db', '#9b59b6', '#f39c12']
  
  let tooltip = []
  
  box.dropGroups.forEach(group => {
    const groupData = groupes.value?.find(g => g.name === group.name)
    const groupPercent = Math.round((group.chance / totalChance) * 100 * 10) / 10
    const groupDescription = getGroupDescription(group.name)
    
    // Titre du groupe en gras avec pourcentage
    tooltip.push(`<span style="font-weight: bold;">${groupDescription} (${groupPercent}%)</span>`)
    
    // Pour les artefacts, utiliser les chances ajustées de la boîte si disponibles
    let rarityChances = groupData?.rarityDropChance
    if (group.name === 'artifacts' && box.adjustedRarityChances) {
      rarityChances = box.adjustedRarityChances
    }
    
    // Obtenir le nombre d'éléments disponibles par rareté
    const availableCounts = getAvailableCountByRarity(group.name)
    
    // Si le groupe a des chances de rareté, les afficher avec les comptes
    if (rarityChances) {
      rarities.forEach((rarity, index) => {
        const rarityChance = rarityChances[index]
        const availableCount = availableCounts[index]
        
        if (rarityChance > 0 || availableCount > 0) {
          // Calculer le pourcentage final : (chance du groupe dans la boîte) * (chance de rareté dans le groupe) / 100
          const rawPercent = (group.chance / totalChance) * (rarityChance / 100) * 100
          
          // Arrondir à 1 décimale maximum pour éviter les erreurs de précision
          const finalPercent = Math.round(rawPercent * 10) / 10
          
          // Afficher même si le pourcentage est 0 mais qu'il y a des éléments disponibles
          if (finalPercent > 0 || availableCount > 0) {
            tooltip.push(`  <span style="color: ${colors[index]};">${rarity}: ${finalPercent}% (${availableCount})</span>`)
          }
        }
      })
    }
  })
  
  return tooltip.join('<br>')
}

// Tooltips pour les tokens
const stockTokenTooltip = computed(() => {
  const tokenData = itemsData.value?.stock_token
  if (!tokenData) return '<strong>🧺 Jetons de stock</strong><br>Jetons pour améliorer le stockage.'
  return `<strong>${tokenData.nom.charAt(0).toUpperCase() + tokenData.nom.slice(1)}</strong><br>${tokenData.description}`
})

const productionTokenTooltip = computed(() => {
  const tokenData = itemsData.value?.production_token
  if (!tokenData) return '<strong>⚙️ Jetons de production</strong><br>Jetons pour améliorer la production.'
  return `<strong>${tokenData.nom.charAt(0).toUpperCase() + tokenData.nom.slice(1)}</strong><br>${tokenData.description}`
})

const chestKeyTooltip = computed(() => {
  const tokenData = itemsData.value?.chest_key
  if (!tokenData) return '<strong>🗝️ Clés à coffre</strong><br>Ouvrez des coffres de trésors pour obtenir des artefacts de minage.'
  return `<strong>${tokenData.nom.charAt(0).toUpperCase() + tokenData.nom.slice(1)}</strong><br>${tokenData.description}`
})

const preciousStoneTooltip = computed(() => {
  const tokenData = itemsData.value?.precious_stone
  if (!tokenData) return '<strong>💎 Pierres précieuses</strong><br>Ressource rare obtenue en minant.'
  return `<strong>${tokenData.nom.charAt(0).toUpperCase() + tokenData.nom.slice(1)}</strong><br>${tokenData.description}`
})

// Helpers calcul côté front à partir des données serveur
function getCurrentCostForLevel(costs, level) {
  if (!Array.isArray(costs) || costs.length === 0) return Infinity
  // Pour les améliorations infinies, toujours utiliser le prix le plus élevé
  return Math.max(...costs)
}
function getCurrentRewardForLevel(rewards, level) {
  if (!Array.isArray(rewards) || rewards.length === 0) return 0
  if (level >= rewards.length) return rewards[rewards.length - 1]
  return rewards[level]
}
function getDisplayLevel(currentLevel, maxLevel) {
  if (maxLevel !== null && typeof maxLevel === 'number' && currentLevel >= maxLevel) return 'MAX'
  return `Niveau ${currentLevel}`
}

const expansionOffers = computed(() => {
  const list = expansionsData?.value || []
  const playerLevel = getLevel()
  return list
    .filter(expansion => {
      // Hide artifact slot expansions if player level < 5
      if (expansion.name && expansion.name.toLowerCase().includes('emplacements d\'artéfact') && playerLevel < 5) {
        return false
      }
      return true
    })
    .map(expansion => {
      const currentLevel = getExpansionLevel(expansion.id)
      const nextLevel = getNextExpansionLevel(expansion.id)
      const canUpgrade = canUpgradeExpansion(expansion.id)
      const cost = getExpansionCost(expansion.id)
      const reward = getExpansionReward(expansion.id)
      const canBuy = canUpgrade && playerLevel >= (expansion.unlock_level || 1) && canAffordMultiple(cost)
      
      // Générer le texte d'effet basé sur le template
      const effectText = expansion.effectTemplate.replace('{reward}', reward || 'Ø')
      
      return {
        ...expansion,
        currentLevel,
        nextLevel,
        canUpgrade,
        cost,
        reward,
        canBuy,
        effect: effectText,
        displayLevel: currentLevel > 0 ? `${reward || 1} emplacements` : 'Non acheté'
      }
    })
})

const upgradeOffers = computed(() => {
  const list = serverUpgrades?.value || []
  return list.map(upgrade => {
    const currentLevel = Number(upgradeLevels.value?.[upgrade.id] || 0)
    // Les améliorations de ferme n'ont pas de niveau max - elles peuvent être améliorées à l'infini
    const cost = getCurrentCostForLevel(upgrade.costs, currentLevel)
    const price = { type: upgrade.priceType, count: Number(cost) || 0 }
    const canBuy = Number(price.count) > 0 && canAfford(price)
    const displayLevel = `Niveau ${currentLevel}`
    const effect = upgrade.effectTemplate?.replace('{reward}', getCurrentRewardForLevel(upgrade.rewards, currentLevel)) || 'Effet inconnu'
    
    return {
      ...upgrade,
      currentLevel,
      displayLevel,
      price,
      canBuy,
      effect
    }
  })
})

// Calcul côté Marché: existe-t-il au moins une amélioration achetable maintenant ?
const hasAvailableUpgrade = computed(() => {
  const list = serverUpgrades?.value || []
  if (!Array.isArray(list) || list.length === 0) return false

  return list.some(u => {
    const currentLevel = Number(upgradeLevels.value?.[u.id] || 0)
    // Les améliorations de ferme n'ont pas de niveau max
    const cost = getCurrentCostForLevel(u.costs, currentLevel)
    const price = { type: u.priceType, count: Number(cost) || 0 }
    return Number(price.count) > 0 ? canAfford(price) : false
  })
})

// Expose via un event global pour que la BottomBar puisse s'y abonner
function broadcastUpgradeAvailability() {
  try {
    const available = !!hasAvailableUpgrade.value
    if (typeof window !== 'undefined') {
      window.__marketHasAvailableUpgrade = available
      window.dispatchEvent(new CustomEvent('market-available-upgrade-changed', { detail: { available } }))
    }
  } catch (_) {}
}

// Publier à l'init et à chaque changement de dépendances pertinentes
onMounted(() => {
  broadcastUpgradeAvailability()
})

watch([serverUpgrades, upgradeLevels, stockTokens, productionTokens, wildTokens], () => {
  broadcastUpgradeAvailability()
})

// Fonctions d'achat
function getBulkPrice(price, qty) {
  if (typeof price === 'number') return price * qty
  if (price && typeof price === 'object') {
    return { type: price.type, count: (Number(price.count) || 0) * qty }
  }
  return price
}

function getMaxAffordableOpens(price, desiredQty) {
  // Calcule combien d'ouvertures sont possibles avec les fonds locaux
  const qty = Math.max(1, Number(desiredQty) || 1)
  if (typeof price === 'number') {
    const per = Number(price) || 0
    if (per <= 0) return qty
    return Math.min(qty, Math.floor((Number(playerEggs.value) || 0) / per))
  }
  const count = Number(price?.count) || 0
  if (count <= 0) return qty
  const type = price?.type
  let balance = 0
  if (type === 'eggs') balance = Number(playerEggs.value) || 0
  else if (type === 'stock_token') balance = Number(stockTokens.value) || 0
  else if (type === 'production_token') balance = Number(productionTokens.value) || 0
  else if (type === 'wild_token') balance = Number(wildTokens.value) || 0
  else if (type === 'chest_key') balance = Number(chestKeys.value) || 0
  else balance = 0
  return Math.min(qty, Math.floor(balance / count))
}

async function openBox(box) {
  try {
    // Lancer l'animation d'ouverture
    currentBoxIcon.value = box.icon || '📦'
    showOpenAnim.value = true
    sndBoxOpen(0.95)

    const minAnim = new Promise(res => setTimeout(res, 1000)) // 1s minimum pour x1
    const apiCall = openBoxAPI(box.id)
    const result = await Promise.all([minAnim, apiCall]).then(([, r]) => r)

    // Arrêter l'animation et préparer l'affichage des résultats
    showOpenAnim.value = false

    // --- NOUVEAU : rafraîchir la liste des artefacts possédés et les boîtes dispo
    try {
      await fetchArtifacts()
    } catch (e) { console.warn('fetchArtifacts after openBox failed:', e) }
    try {
      availableBoxes.value = await getAvailableBoxes()
    } catch (e) { console.warn('getAvailableBoxes after openBox failed:', e) }
    // --- FIN NOUVEAU

    // Trier les résultats par rareté (les plus rares en haut)
    const singleResults = Array.isArray(result.results) ? [...result.results] : []
    const rarityOrder = { legendaire: 4, légendaire: 4, epique: 3, épique: 3, rare: 2, commune: 1 }
    singleResults.sort((a, b) => (rarityOrder[b?.rarete] || 0) - (rarityOrder[a?.rarete] || 0))
    boxResults.value = singleResults
    lastOpenedBoxName.value = box.name
  // Effet et son spéciaux si un légendaire est présent
  try {
    const hasLegendary = singleResults.some(r => (r?.rarete === 'legendaire' || r?.rarete === 'légendaire'))
    const hasEpic = singleResults.some(r => (r?.rarete === 'epique' || r?.rarete === 'épique'))
    if (hasLegendary) {
      sndLegend(1)
      triggerLegendaryFX()
    } else if (hasEpic) {
      sndEpic(0.95)
    }
  } catch (_) {}
  // Son des résultats (général)
  sndBoxResults(0.9)
    showBoxResults.value = true
    
    // Rafraîchir les données du joueur
    await Promise.all([
      refreshPlayerData(),
      refreshPoules()
    ])

    // Si c'est une boîte d'artefacts, recharger les boîtes pour mettre à jour les pourcentages
    if (box.category === 'artifacts') {
      try {
        availableBoxes.value = await getAvailableBoxes()
      } catch (err) {
        console.warn('Erreur lors du rechargement des boîtes:', err)
      }
    }

    // Émettre des événements pour que les succès se rafraîchissent immédiatement
    try {
      if (result?.results) {
        for (const r of result.results) {
          window.dispatchEvent(new CustomEvent('chicken-bought', { detail: { especeId: r.especeId, isNew: r.isNew } }))
        }
      }
    } catch (_) {}
    
  // Toast de succès
    if (result.results && result.results.length > 0) {
      const newChickens = result.results.filter(r => r.isNew).length
      const totalChickens = result.results.length
      
      //let message = `🎉 Boîte ouverte ! ${totalChickens} poule${totalChickens > 1 ? 's' : ''} obtenue${totalChickens > 1 ? 's' : ''}`
      //if (newChickens > 0) {
      //  message += ` (${newChickens} nouvelle${newChickens > 1 ? 's' : ''})`
      //}
      //
      //window.$toast && window.$toast(message, 'success')
    } else {
      window.$toast && window.$toast('Aucune poule obtenue cette fois... 😢', 'warning')
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'ouverture de la boîte:', error)
    showOpenAnim.value = false
    window.$toast && window.$toast(
      error.message || 'Erreur lors de l\'ouverture de la boîte',
      'error'
    )
  }
}

function buyChicken(offer) {
  // Cette fonction n'est plus utilisée car on achète des boîtes maintenant
}

// Fonction helper pour vérifier si on peut payer un coût multiple
function canAffordMultiple(costArray) {
  if (!Array.isArray(costArray)) return canAfford(costArray)
  
  for (const cost of costArray) {
    if (!canAfford(cost)) return false
  }
  return true
}

async function openBoxMultiple(box, times = 10) {
  try {
    const desired = Math.max(1, Number(times) || 1)
    const affordable = getMaxAffordableOpens(box.price, desired)
    if (affordable <= 0) {
      window.$toast && window.$toast("Fonds insuffisants pour ouvrir cette boîte", 'error')
      return
    }

    currentBoxIcon.value = box.icon || '📦'
    showOpenAnim.value = true
    sndBoxOpen(0.95)

    // Utiliser le délai minimum selon le nombre d'ouvertures
    const minAnimDelay = getMinAnimationDelay(affordable)
    const minAnim = new Promise(res => setTimeout(res, minAnimDelay))

    // Utiliser la nouvelle API optimisée pour ouvrir plusieurs boîtes à la fois
    const result = await openBoxMultipleAPI(box.id, affordable)

    // Attendre que l'animation minimum soit terminée
    await minAnim

    showOpenAnim.value = false

    if (result && result.results && result.results.length > 0) {
      // --- NOUVEAU : rafraîchir artefacts et boîtes après les ouvertures
      try {
        await fetchArtifacts()
      } catch (e) { console.warn('fetchArtifacts after openBoxMultiple failed:', e) }
      try {
        availableBoxes.value = await getAvailableBoxes()
      } catch (e) { console.warn('getAvailableBoxes after openBoxMultiple failed:', e) }
      // --- FIN NOUVEAU

      // Trier par rareté (les plus rares en haut)
      const rarityOrder = { legendaire: 4, légendaire: 4, epique: 3, épique: 3, rare: 2, commune: 1 }
      const combined = Array.isArray(result.results) ? [...result.results] : []
      combined.sort((a, b) => (rarityOrder[b?.rarete] || 0) - (rarityOrder[a?.rarete] || 0))
      boxResults.value = combined
      lastOpenedBoxName.value = `${box.name} x${result.count || affordable}`

      // Effet et son spéciaux si un légendaire est présent dans le lot
      try {
        const hasLegendary = combined.some(r => (r?.rarete === 'legendaire' || r?.rarete === 'légendaire'))
        const hasEpic = combined.some(r => (r?.rarete === 'epique' || r?.rarete === 'épique'))
        if (hasLegendary) {
          sndLegend(1)
          triggerLegendaryFX()
        } else if (hasEpic) {
          sndEpic(0.95)
        }
      } catch (_) {}

      sndBoxResults(0.9)
      showBoxResults.value = true

      // Rafraîchir les données du joueur et les poules
      await Promise.all([refreshPlayerData(), refreshPoules()])
      
      // Si c'est une boîte d'artefacts, recharger les boîtes pour mettre à jour les pourcentages
      if (box.category === 'artifacts') {
        try {
          availableBoxes.value = await getAvailableBoxes()
        } catch (err) {
          console.warn('Erreur lors du rechargement des boîtes:', err)
        }
      }
      
      // Événements succès pour chaque poule obtenue
      try {
        for (const r of combined) {
          window.dispatchEvent(new CustomEvent('chicken-bought', { detail: { especeId: r.especeId, isNew: r.isNew } }))
        }
      } catch (_) {}

      // Toast résumé
      const newCount = combined.filter(r => r.isNew).length
      const total = combined.length
      // window.$toast && window.$toast(`🎉 ${result.count || affordable} boîte${(result.count || affordable)>1?'s':''} ouvertes: ${total} poule${total>1?'s':''} obtenue${total>1?'s':''}${newCount>0?` (${newCount} nouvelle${newCount>1?'s':''})`:''}`, 'success')
    } else {
      window.$toast && window.$toast('Aucune boîte ouverte', 'warning')
    }
  } catch (e) {
    console.error('Erreur openBoxMultiple:', e)
    showOpenAnim.value = false
    window.$toast && window.$toast('Erreur lors de l\'ouverture multiple', 'error')
  }
}

async function buyExpansionOffer(expansion) {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      window.$toast && window.$toast('Vous devez être connecté(e)', 'error')
      return
    }

    sndConfirm(0.8) // Son d'achat

    const result = await buyExpansion(expansion.id)
    if (result.success) {
      // Rafraîchir les données du joueur
      await refreshPlayerData()
      // Rafraîchir les niveaux d'expansions
      await fetchExpansionLevels()

      window.$toast && window.$toast(`${expansion.name} acheté !`, 'success')
    } else {
      window.$toast && window.$toast(result.error || 'Erreur lors de l\'achat', 'error')
    }
  } catch (e) {
    console.error('buyExpansionOffer error:', e)
    window.$toast && window.$toast('Erreur lors de l\'achat', 'error')
  }
}

async function buyUpgrade(upgrade) {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      window.$toast && window.$toast('Vous devez être connecté(e)', 'error')
      return
    }

    sndConfirm(0.8) // Son d'achat

    const result = await apiPost('/api/upgrades/buy', { upgradeId: upgrade.id })
    if (result.success) {
      // Mettre à jour le niveau local
      upgradeLevels.value = { ...upgradeLevels.value, [upgrade.id]: result.newLevel }
      upgradesVersion.value++

      // Rafraîchir les données du joueur
      await refreshPlayerData()

      window.$toast && window.$toast(`${upgrade.name} amélioré au niveau ${result.newLevel} !`, 'success')
    } else {
      window.$toast && window.$toast(result.error || 'Erreur lors de l\'achat', 'error')
    }
  } catch (e) {
    console.error('buyUpgrade error:', e)
    window.$toast && window.$toast('Erreur lors de l\'achat', 'error')
  }
}

function closeBoxResults() {
  sndClose()
  showBoxResults.value = false
  boxResults.value = []
  lastOpenedBoxName.value = ''
}

// Charger les données au montage du composant
onMounted(async () => {
  try {
    // Redirection si le marché n'est pas encore débloqué
    const lvl = getLevel()
    // Recherche du niveau où 'market' est débloqué dans les données centralisées
    let requiredLevel = 2
    try {
      const entries = Object.entries(levelUnlocks?.value || {})
      const entry = entries.find(([n, arr]) => (arr || []).some(u => u.id === 'market'))
      if (entry) requiredLevel = parseInt(entry[0], 10)
    } catch (_) {}
    if (lvl < requiredLevel) {
      router.replace('/production')
      return
    }
    // Rafraîchir d'abord les ressources/tokens pour refléter d'éventuelles récompenses de level-up
    try { await refreshPlayerData() } catch (_) {}
    // Charger les niveaux d'améliorations depuis l'API et les appliquer
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const { upgrades: levels } = await apiGet('/api/upgrades')
        if (levels && typeof levels === 'object') {
          upgradeLevels.value = Object.fromEntries(
            Object.entries(levels).map(([k, v]) => [Number(k), Number(v) || 0])
          )
          upgradesVersion.value++
        }
      }
    } catch (e) { console.warn('Chargement upgrades échoué:', e) }

    // Charger les niveaux d'expansions depuis l'API
    try {
      await fetchExpansionLevels()
    } catch (e) { console.warn('Chargement expansions échoué:', e) }
    
    // Charger les artefacts possédés
    try { await fetchArtifacts() } catch (_) {}
    
    availableBoxes.value = await getAvailableBoxes()
  } catch (error) {
    console.error('Erreur lors du chargement des boîtes:', error)
    // Fallback sur les données locales en cas d'erreur
    availableBoxes.value = boxesData
  }
})

// Effet visuel "de fou" pour drop légendaire
function triggerLegendaryFX() {
  try {
    const el = document.createElement('div')
    el.className = 'legendary-fx'
    document.body.appendChild(el)
    setTimeout(() => { el.classList.add('show') }, 10)
    setTimeout(() => {
      el.classList.remove('show')
      setTimeout(() => el.remove(), 500)
    }, 1500)
  } catch (_) {}
}



// Fonction pour obtenir le délai d'animation minimum selon le nombre d'ouvertures
function getMinAnimationDelay(count) {
  if (count >= 100) return 2000 
  if (count >= 10) return 1000  
  return 500
}

// Effet épique désormais géré directement sur la carte dans BoxResults.vue
</script>

<style scoped>
.market-view {
  padding: 24px;
  background: #f9f3e8;
  font-family: 'Fredoka', sans-serif;
  flex: 1;
  width: 100%;
  overflow-y: auto;
  max-height: 100vh;
  box-sizing: border-box;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  margin: 0;
  color: #6d3c00;
}

.player-balance {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.balance-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #fff7dc;
  border: 2px solid #ffc66e;
  border-radius: 12px;
  padding: 8px 12px;
  font-weight: bold;
  color: #6d3c00;
}

.balance-icon {
  font-size: 16px;
}

/* Onglets */
.market-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e0d0b0;
  padding-bottom: 12px;
}

.tab-button {
  background: #fff7dc;
  border: 2px solid #ffc66e;
  border-radius: 8px 8px 0 0;
  padding: 10px 16px;
  font-family: 'Fredoka', sans-serif;
  font-weight: bold;
  color: #6d3c00;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: all 0.2s ease;
  position: relative;
}

.tab-button:hover {
  background: #ffeaa7;
  transform: translateY(-2px);
}

.tab-button.active {
  background: #ffdd57;
  border-bottom-color: #f9f3e8;
  transform: translateY(-2px);
}

.badge-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  background-color: #FFD700;
  border: 2px solid #8B4513;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.8);
}
.badge-dot--yellow { background-color: #e59f35; border-color: #8b6b00; }
/* Top-right badge on tab */
.tab-badge {
  position: absolute;
  top: -6px;
  right: -6px;
}

/* Contenu */
.market-content {
  min-height: 400px;
}

.market-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-header {
  margin-bottom: 24px;
  text-align: center;
}

.section-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #6d3c00;
}

.section-description {
  margin: 0;
  color: #8b4513;
  font-size: 14px;
}

.subsection-header {
  margin: 40px 0 24px 0;
  text-align: center;
  border-top: 2px solid #e0d0b0;
  padding-top: 32px;
}

.subsection-header h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #6d3c00;
}

.subsection-description {
  margin: 0;
  color: #8b4513;
  font-size: 13px;
}

/* Grille des éléments */
.market-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  justify-content: center;
  max-width: 1200px;
  margin: 0 auto;
  margin-bottom: 30px;
}


.market-item {
  background: #fff;
  border: 3px solid #ffc66e;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.market-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: #ffb347;
}

/* Éléments boîtes */
.box-item {
  background: linear-gradient(135deg, #fff 0%, #f8f4e6 100%);
  border: 3px solid #ffc66e;
  position: relative;
}

.box-item:hover {
  border-color: #ffb347;
  background: linear-gradient(135deg, #fff7dc 0%, #f0e6d2 100%);
}

.box-item.locked {
  filter: grayscale(0.8) brightness(0.9);
}

.box-item .locked-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.35);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.box-item .locked-content {
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  padding: 6px 10px;
  background: rgba(0,0,0,0.35);
  border: 2px solid #ffc66e;
  border-radius: 10px;
}

.box-icon-container {
  position: relative;
  text-align: center;
  margin-bottom: 12px;
}

.box-counter {
  position: absolute;
  top: -8px;
  left: -8px;
  z-index: 10;
}

.counter-badge {
  background: #6d3c00;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 8px;
  border: 2px solid #ffc66e;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  min-width: 20px;
  text-align: center;
}

.dice-counter {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 10;
}

.dice-badge {
  background: #6d3c00;
  color: white;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 6px;
  border: 2px solid #ffc66e;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.box-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.box-contents {
  margin-top: 8px;
  padding: 8px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 6px;
  border: 1px solid #ffc66e;
}

.drop-groups {
  margin-bottom: 8px;
}

.drop-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  padding: 2px 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.drop-group:last-child {
  margin-bottom: 0;
}

.group-label {
  font-size: 10px;
  font-weight: bold;
  color: #8b4513;
  flex: 1;
}

.group-quantity {
  font-size: 9px;
  color: #6d3c00;
  font-weight: bold;
  background: rgba(109, 60, 0, 0.1);
  padding: 1px 4px;
  border-radius: 2px;
}

.guaranteed-group {
  margin-bottom: 6px;
}

/* Éléments poules (maintenant inutilisé mais gardé pour compatibilité) */
.item-image {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.rarity-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
}

.rarity-badge.commune {
  background: #95a5a6;
  color: white;
}

.rarity-badge.rare {
  background: #3498db;
  color: white;
}

.rarity-badge.épique {
  background: #9b59b6;
  color: white;
}

.rarity-badge.légendaire {
  background: #f39c12;
  color: white;
}

.item-info {
  text-align: center;
  flex: 1;
}

.item-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #6d3c00;
}

.item-description {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #8b4513;
  line-height: 1.4;
}

.item-stats, .upgrade-effect {
  font-size: 12px;
  color: #27ae60;
  font-weight: bold;
}

.upgrade-level {
  margin: 8px 0;
}

.level-text {
  font-size: 11px;
  color: #8b4513;
  font-weight: bold;
  background: rgba(255, 215, 0, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #ffc66e;
}

/* Améliorations */
.upgrade-item {
  flex-direction: row;
  align-items: center;
  text-align: left;
}

.upgrade-icon {
  font-size: 32px;
  margin-right: 12px;
}

.upgrade-item .item-info {
  text-align: left;
  flex: 1;
}

/* Expansions */
.expansion-item {
  flex-direction: row;
  align-items: center;
  text-align: left;
}

.expansion-item.purchased {
  opacity: 0.6;
  background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%);
  border-color: #4caf50;
}

.expansion-icon {
  font-size: 32px;
  margin-right: 12px;
}

.expansion-item .item-info {
  text-align: left;
  flex: 1;
}

.expansion-description {
  margin: 8px 0;
}

.description-text {
  font-size: 12px;
  color: #8b4513;
  line-height: 1.4;
}

.expansion-effect {
  margin: 8px 0;
}

.effect-text {
  font-size: 12px;
  color: #27ae60;
  font-weight: bold;
}

/* Achat */
.item-purchase {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.item-purchase-big {
  padding-top: 12px;
  border-top: 1px solid #e0d0b0;
}

.price-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.original-price {
  font-size: 11px;
  color: #95a5a6;
}

.strikethrough {
  text-decoration: line-through;
}

.price {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: bold;
  color: #6d3c00;
}

.price-icon {
  font-size: 14px;
}

/* Styles pour ActionButton dans le contexte du marché */
.item-purchase .action-button {
  min-width: 80px;
  white-space: nowrap;
}

.confirmation-buttons .action-button {
  min-width: 100px;
}

/* Responsive */
@media (max-width: 768px) {
  .market-view {
    padding: 16px;
  }
  
  .market-grid {
    grid-template-columns: 1fr;
    max-width: 100%;
  }
  
  .header-bar {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  
  .market-tabs {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .upgrade-item {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .market-grid {
    grid-template-columns: repeat(2, 1fr);
    max-width: 800px;
  }
}
</style>

<style>
/* Effet visuel global pour drop légendaire */
.legendary-fx {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 99999;
  opacity: 0;
  background: radial-gradient(ellipse at center, rgba(255,215,0,0.25) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.85) 100%);
  box-shadow: inset 0 0 120px rgba(255, 215, 0, 0.35), inset 0 0 240px rgba(255, 165, 0, 0.2);
  transition: opacity 150ms ease;
}
.legendary-fx.show {
  opacity: 1;
  animation: legendary-pulse 1200ms ease-out forwards;
}
@keyframes legendary-pulse {
  0% { filter: brightness(1) saturate(1); }
  25% { filter: brightness(1.8) saturate(1.4); }
  50% { filter: brightness(1.4) saturate(1.2); }
  100% { filter: brightness(1) saturate(1); opacity: 0; }
}

/* Effet visuel global pour drop épique */
.epic-fx {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 99998;
  opacity: 0;
  background: radial-gradient(ellipse at center, rgba(155, 89, 182, 0.2) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.8) 100%);
  box-shadow: inset 0 0 100px rgba(155, 89, 182, 0.35), inset 0 0 200px rgba(142, 68, 173, 0.25);
  transition: opacity 120ms ease;
}
.epic-fx.show {
  opacity: 1;
  animation: epic-pulse 1000ms ease-out forwards;
}
@keyframes epic-pulse {
  0% { filter: brightness(1) saturate(1); }
  25% { filter: brightness(1.5) saturate(1.3); }
  50% { filter: brightness(1.25) saturate(1.15); }
  100% { filter: brightness(1) saturate(1); opacity: 0; }
}
</style>
