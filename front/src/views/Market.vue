
<template>
  <div class="market-view">
    <div class="header-bar">
      <h2 class="section-title">🛒 Marché</h2>
      <div class="player-balance">
        <Tooltip :text="`<strong>${achievementsData.eggs.nom.charAt(0).toUpperCase() + achievementsData.eggs.nom.slice(1)}</strong><br>${achievementsData.eggs.description}`" position="bottom">
        <div class="balance-item">
          <span class="balance-icon">🥚</span>
          <span class="balance-amount">{{ playerEggs }}</span>
        </div>
      </Tooltip>
      <Tooltip :text="`<strong>${achievementsData.stock_token.nom.charAt(0).toUpperCase() + achievementsData.stock_token.nom.slice(1)}</strong><br>${achievementsData.stock_token.description}`" position="bottom">
        <div class="balance-item">
          <span class="balance-icon">📦</span>
          <span class="balance-amount">{{ stockTokens }}</span>
        </div>
      </Tooltip>
      <Tooltip :text="`<strong>${achievementsData.production_token.nom.charAt(0).toUpperCase() + achievementsData.production_token.nom.slice(1)}</strong><br>${achievementsData.production_token.description}`" position="bottom">
        <div class="balance-item">
          <span class="balance-icon">⚡</span>
          <span class="balance-amount">{{ productionTokens }}</span>
        </div>
      </Tooltip>
      <Tooltip :text="`<strong>${achievementsData.wild_token.nom.charAt(0).toUpperCase() + achievementsData.wild_token.nom.slice(1)}</strong><br>${achievementsData.wild_token.description}`" position="bottom">
        <div class="balance-item">
          <span class="balance-icon">🃏</span>
          <span class="balance-amount">{{ wildTokens }}</span>
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
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
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
          >
            <div class="box-counter">
              <Tooltip :text="getBoxTooltipText(box)">
                <div class="counter-badge">
                  {{ getBoxChickenStats(box).ownedCount }}/{{ getBoxChickenStats(box).totalCount }}
                </div>
              </Tooltip>
            </div>
            <div class="dice-counter">
              <Tooltip :text="getDiceTooltipText(box)">
                <div class="dice-badge">
                  🎲
                </div>
              </Tooltip>
            </div>
            <div class="box-icon-container">
              <div class="box-icon">{{ box.icon }}</div>
              <div class="rarity-badge" :class="box.rarity">{{ box.rarity }}</div>
            </div>
            <div class="item-info">
              <h4 class="item-name">{{ box.name }}</h4>
              <p class="item-description">{{ box.description }}</p>
              <div class="box-contents">
                <div class="drop-groups">
                  <div v-for="group in box.dropGroups" :key="group.name" class="drop-group">
                    <span class="group-label">{{ getGroupDescription(group.name) }} ({{ group.chance }}%)</span>
                    <span class="group-quantity" v-if="group.quantity > 1">x{{ group.quantity }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="item-purchase item-purchase-big">
              <BuyButton
                :price="box.price"
                :onClick="() => openBox(box)"
                :disabled="!canAfford(box.price)"
              >
                Ouvrir
              </BuyButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Onglet Améliorations -->
      <div v-if="activeTab === 'upgrades'" class="market-section">
        <div class="section-header">
          <h3>⚡ Améliorations</h3>
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
              <!--p class="item-description">{{ upgrade.description }}</p-->
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
                :disabled="!canAfford(upgrade.price) || !upgrade.canBuy"
              >
                {{ upgrade.canBuy ? 'Acheter' : 'MAX' }}
              </BuyButton>
            </div>
          </div>
        </div>
      </div>


    </div>

    <!-- Popup des résultats de boîte -->
    <BoxResults
      :showResults="showBoxResults"
      :results="boxResults"
      :boxName="lastOpenedBoxName"
      @close="closeBoxResults"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePlayer } from '@/composables/usePlayer'
import { usePoules } from '@/composables/usePoules'
import { useGameData } from '@/composables/useGameData'
import { useBoxes } from '@/composables/useBoxes'
import { useAchievements } from '@/composables/useAchievements'
import ActionButton from '@/components/menu/ActionButton.vue'
import BuyButton from '@/components/menu/BuyButton.vue'

import BoxResults from '@/components/menu/BoxResults.vue'
import { boxesData, getPossibleChickensFromBox, openBoxSimulation, groupes } from '@/data/boxes.js'
import { getUpgradesWithCalculatedData, upgradeLevel } from '@/data/upgrades.js'
import { formatPrice, achievementsData } from '@/data/items.js'
import Tooltip from '@/components/menu/Tooltip.vue'

const { eggs: playerEggs, stockTokens, productionTokens, wildTokens, canAfford, refreshPlayerData } = usePlayer()
const { poules, refreshPoules } = usePoules()
const { loading: boxLoading, openBox: openBoxAPI, getAvailableBoxes } = useBoxes()
const { checkAchievements } = useAchievements()
const { especies: especeData } = useGameData()

// État des onglets
const activeTab = ref('boxes')

// État des popups
const showBoxResults = ref(false)
const boxResults = ref([])
const lastOpenedBoxName = ref('')

// Boîtes disponibles depuis l'API
const availableBoxes = ref([])

// Configuration des onglets
const tabs = [
  { id: 'boxes', name: 'Boîtes', icon: '🧰' },
  { id: 'upgrades', name: 'Améliorations', icon: '⚡' }
]

// Données des boîtes depuis l'API
const boxOffers = computed(() => availableBoxes.value)

// Poules débloquées (uniquement les poules obtenues par le joueur)
const unlockedChickens = computed(() => {
  const ownedChickens = poules.value
    .filter(poule => poule.quantite > 0)
    .map(poule => poule.especeId)
  
  return ownedChickens
})

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

// Fonction pour récupérer la description d'un groupe depuis boxes.js
function getGroupDescription(groupName) {
  const group = groupes.find(g => g.name === groupName)
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
    const groupData = groupes.find(g => g.name === group.name)
    if (groupData && groupData.rarityDropChance) {
      const weight = group.chance / totalChance
      groupData.rarityDropChance.forEach((prob, index) => {
        avgProbabilities[index] += prob * weight
      })
    }
  })
  
  return avgProbabilities.map(prob => Math.round(prob))
}

// Fonction pour générer le texte du tooltip du dé
function getDiceTooltipText(box) {
  const probs = getBoxRarityProbabilities(box)
  const rarities = ['Commune', 'Rare', 'Épique', 'Légendaire']
  const colors = ['#95a5a6', '#3498db', '#9b59b6', '#f39c12']
  
  return rarities
    .map((rarity, index) => 
      probs[index] > 0 
        ? `<span style="color: ${colors[index]}; font-weight: bold;">${rarity}: ${probs[index]}%</span>`
        : null
    )
    .filter(Boolean)
    .join('<br>')
}

// Données des améliorations avec progression
const upgradeOffers = computed(() => getUpgradesWithCalculatedData())

// Fonctions d'achat
async function openBox(box) {
  try {
    console.log('Achat boîte:', box)
    const result = await openBoxAPI(box.id)
    
    // Afficher les résultats
    boxResults.value = result.results || []
    lastOpenedBoxName.value = box.name
    showBoxResults.value = true
    
    // Rafraîchir les données du joueur
    await Promise.all([
      refreshPlayerData(),
      refreshPoules()
    ])

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
      
      let message = `🎉 Boîte ouverte ! ${totalChickens} poule${totalChickens > 1 ? 's' : ''} obtenue${totalChickens > 1 ? 's' : ''}`
      if (newChickens > 0) {
        message += ` (${newChickens} nouvelle${newChickens > 1 ? 's' : ''})`
      }
      
      window.$toast && window.$toast(message, 'success')
    } else {
      window.$toast && window.$toast('Aucune poule obtenue cette fois... 😢', 'warning')
    }

    // Vérifier immédiatement les succès liés aux boîtes et aux poules
    try {
      const newAch = await checkAchievements()
      if (newAch && newAch.length) {
        window.$toast && window.$toast(`🎉 ${newAch.length} succès débloqué(s)`, 'success')
      }
    } catch (_) {}
    
  } catch (error) {
    console.error('Erreur lors de l\'ouverture de la boîte:', error)
    window.$toast && window.$toast(
      error.message || 'Erreur lors de l\'ouverture de la boîte',
      'error'
    )
  }
}

function buyChicken(offer) {
  // Cette fonction n'est plus utilisée car on achète des boîtes maintenant
  console.log('Achat direct de poule désactivé - utilisez les boîtes')
}

function buyUpgrade(upgrade) {
  if (!upgrade.canBuy) {
    if (window.$toast) {
      window.$toast('Cette amélioration est au niveau maximum !', 'warning')
    }
    return
  }
  
  console.log('Achat amélioration:', upgrade)
  
  // Augmenter le niveau de l'amélioration
  upgradeLevel(upgrade)
  
  // TODO: Implémenter l'achat d'amélioration côté serveur
  if (window.$toast) {
    window.$toast(`Vous avez acheté ${upgrade.name} ${upgrade.displayLevel} !`, 'success')
  }
}

function closeBoxResults() {
  showBoxResults.value = false
  boxResults.value = []
  lastOpenedBoxName.value = ''
}

// Charger les données au montage du composant
onMounted(async () => {
  try {
    availableBoxes.value = await getAvailableBoxes()
  } catch (error) {
    console.error('Erreur lors du chargement des boîtes:', error)
    // Fallback sur les données locales en cas d'erreur
    availableBoxes.value = boxesData
  }
})
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

/* Grille des éléments */
.market-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  justify-content: center;
  max-width: 1200px;
  margin: 0 auto;
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
