<template>
  <div class="market-view">
    <div class="header-bar">
      <h2 class="section-title">🛒 Marché</h2>
      <div class="player-balance">
        <div class="balance-item">
          <span class="balance-icon">🥚</span>
          <span class="balance-amount">{{ playerEggs }}</span>
        </div>
        <div class="balance-item">
          <span class="balance-icon">📦</span>
          <span class="balance-amount">{{ stockTokens }}</span>
        </div>
        <div class="balance-item">
          <span class="balance-icon">⚡</span>
          <span class="balance-amount">{{ productionTokens }}</span>
        </div>
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
          <h3>📦 Boîtes de Poules</h3>
          <p class="section-description">Obtenez de nouvelles poules en ouvrant des boîtes mystères !</p>
        </div>
        
        <div class="market-grid">
          <div 
            v-for="box in boxOffers" 
            :key="box.id"
            class="market-item box-item"
          >
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
                    <span class="group-label">{{ group.description }} ({{ group.chance }}%)</span>
                    <span class="group-quantity" v-if="group.quantity > 1">x{{ group.quantity }}</span>
                  </div>
                </div>
                <div class="available-chickens">
                  <span class="chickens-preview">
                    {{ getChickenPreview(box) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="item-purchase">
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

    <!-- Popup de confirmation -->
    <div v-if="showConfirmation" class="confirmation-overlay" @click="closeConfirmation">
      <div class="confirmation-popup" @click.stop>
        <h3>{{ confirmation.title }}</h3>
        <p>{{ confirmation.message }}</p>
        <div class="confirmation-buttons">
          <ActionButton :onClick="confirmPurchase">
            Confirmer
          </ActionButton>
          <ActionButton :onClick="closeConfirmation">
            Annuler
          </ActionButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePlayer } from '@/composables/usePlayer'
import { usePoules, especeData } from '@/composables/usePoules'
import ActionButton from '@/components/menu/ActionButton.vue'
import BuyButton from '@/components/menu/BuyButton.vue'
import { boxesData, getPossibleChickensFromBox, openBoxSimulation } from '@/data/boxes.js'
import { getUpgradesWithCalculatedData, upgradeLevel } from '@/data/upgrades.js'

const { eggs: playerEggs, stockTokens, productionTokens, canAfford } = usePlayer()
const { poules } = usePoules()

// État des onglets
const activeTab = ref('boxes')

// État des popups
const showConfirmation = ref(false)
const confirmation = ref({
  title: '',
  message: '',
  action: null
})

// Configuration des onglets
const tabs = [
  { id: 'boxes', name: 'Boîtes', icon: '📦' },
  { id: 'upgrades', name: 'Améliorations', icon: '⚡' }
]

// Données des boîtes depuis le fichier dédié
const boxOffers = computed(() => boxesData)

// Poules débloquées (pour l'instant on considère que toutes les poules obtenues + fondamentales sont débloquées)
const unlockedChickens = computed(() => {
  const ownedChickens = poules.value
    .filter(poule => poule.quantite > 0)
    .map(poule => poule.especeId)
  
  // Les poules fondamentales sont toujours débloquées
  const fundamentalChickens = Object.keys(especeData).filter(id => especeData[id].groupe === 'fondamental')
  
  return [...new Set([...ownedChickens, ...fundamentalChickens])]
})

// Fonction pour générer l'aperçu des poules dans les boîtes
function getChickenPreview(box) {
  const allPossibleChickens = []
  
  // Récupérer toutes les poules possibles de tous les groupes
  box.dropGroups.forEach(group => {
    const groupChickens = Object.keys(especeData)
      .filter(id => especeData[id].groupe === group.name)
    allPossibleChickens.push(...groupChickens)
  })
  
  // Supprimer les doublons
  const uniqueChickens = [...new Set(allPossibleChickens)]
  
  // Afficher les 3 premiers avec ??? pour les non débloquées
  const preview = uniqueChickens.slice(0, 3).map(id => {
    const isUnlocked = unlockedChickens.value.includes(id) || especeData[id].groupe === 'fondamental'
    return isUnlocked ? especeData[id]?.nom : '???'
  })
  
  let result = preview.join(', ')
  if (uniqueChickens.length > 3) {
    result += '...'
  }
  
  return result
}

// Données des améliorations avec progression
const upgradeOffers = computed(() => getUpgradesWithCalculatedData())

// Fonctions d'achat
function openBox(box) {
  showPurchaseConfirmation(
    'Ouvrir une boîte',
    `Voulez-vous acheter et ouvrir ${box.name} pour ${box.price} œufs ?`,
    () => {
      console.log('Achat boîte:', box)
      
      // Simuler l'ouverture de boîte avec le nouveau système
      const results = openBoxSimulation(box, especeData, unlockedChickens.value)
      
      if (results.length > 0) {
        const messages = results.map(result => 
          `${especeData[result.chickenId]?.nom || 'une poule'} (${result.groupDescription})`
        )
        
        if (window.$toast) {
          window.$toast(`🎉 Vous avez obtenu : ${messages.join(', ')} !`, 'success')
        }
        
        // TODO: Implémenter l'ajout des poules au joueur via API
        console.log('Poules obtenues:', results)
      } else {
        if (window.$toast) {
          window.$toast('😢 Aucune poule obtenue cette fois-ci...', 'warning')
        }
      }
    }
  )
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
  
  const priceText = `${upgrade.price.count} ${upgrade.price.type === 'stock_token' ? 'jetons de stockage' : 'jetons de production'}`
    
  showPurchaseConfirmation(
    'Acheter une amélioration',
    `Voulez-vous acheter ${upgrade.name} (${upgrade.displayLevel}) pour ${priceText} ?\n\nEffet: ${upgrade.effect}`,
    () => {
      console.log('Achat amélioration:', upgrade)
      
      // Augmenter le niveau de l'amélioration
      upgradeLevel(upgrade)
      
      // TODO: Implémenter l'achat d'amélioration côté serveur
      if (window.$toast) {
        window.$toast(`Vous avez acheté ${upgrade.name} ${upgrade.displayLevel} !`, 'success')
      }
    }
  )
}

function showPurchaseConfirmation(title, message, action) {
  confirmation.value = { title, message, action }
  showConfirmation.value = true
}

function confirmPurchase() {
  if (confirmation.value.action) {
    confirmation.value.action()
  }
  closeConfirmation()
}

function closeConfirmation() {
  showConfirmation.value = false
  confirmation.value = { title: '', message: '', action: null }
}
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
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

.available-chickens {
  font-size: 10px;
  color: #6d3c00;
  line-height: 1.3;
}

.chickens-preview {
  opacity: 0.8;
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

/* Popup de confirmation */
.confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirmation-popup {
  background: #fff;
  border: 3px solid #ffc66e;
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  text-align: center;
  font-family: 'Fredoka', sans-serif;
}

.confirmation-popup h3 {
  margin: 0 0 12px 0;
  color: #6d3c00;
}

.confirmation-popup p {
  margin: 0 0 20px 0;
  color: #8b4513;
}

.confirmation-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* Styles spécifiques pour les ActionButton de confirmation */
.confirmation-buttons .action-button.confirm {
  background: #27ae60;
  border-color: #229954;
}

.confirmation-buttons .action-button.cancel {
  background: #e74c3c;
  border-color: #c0392b;
}

/* Responsive */
@media (max-width: 768px) {
  .market-view {
    padding: 16px;
  }
  
  .market-grid {
    grid-template-columns: 1fr;
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
</style>
