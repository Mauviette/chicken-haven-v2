<template>
  <Popup @close="$emit('close')">
    <div class="seed-shop">
      <h2>🛒 Boutique du Potager</h2>
      
      <div class="roots-display">
        <span class="roots-icon">🫚</span>
        <span class="roots-count">{{ strangeRoots }}</span>
        <span class="roots-label">racines bizarres</span>
      </div>
      
      <!-- Section Graines -->
      <h3 class="section-title">Graines</h3>
      <div class="seeds-grid">
        <div v-for="([type, seed]) in seedsToShow" :key="type" class="seed-card">
          <div class="seed-header">
            <span class="seed-icon">{{ seed.icon }}</span>
            <span class="seed-name">{{ seed.name }}</span>
          </div>
          <div class="seed-info">
            <span>⏱️ {{ seed.growthTime }}</span>
          </div>
          <div class="seed-reward">
            Récolte: {{ seed.minReward }}-{{ seed.maxReward }} {{ seed.vegIcon }}
          </div>
          <div class="seed-button-wrapper">
            <BuyButton 
              :onClick="() => onBuy(type)"
              :disabled="strangeRoots < seed.price || loading"
              :price="{ type: 'strange_root', count: seed.price, _iconOverride: '🫚' }"
            >
              Acheter {{ seed.seedsGiven }} graines
            </BuyButton>
          </div>
        </div>
      </div>
      
      <!-- Pagination des graines -->
      <div v-if="totalSeedPages > 1" class="pagination">
        <button 
          @click="seedPage = Math.max(0, seedPage - 1)" 
          :disabled="seedPage === 0"
          class="page-btn"
        >
          ‹ Précédent
        </button>
        <span class="page-info">{{ seedPage + 1 }} / {{ totalSeedPages }}</span>
        <button 
          @click="seedPage = Math.min(totalSeedPages - 1, seedPage + 1)" 
          :disabled="seedPage >= totalSeedPages - 1"
          class="page-btn"
        >
          Suivant ›
        </button>
      </div>
      
      <!-- Section Améliorations -->
      <h3 class="section-title">Place de l'inventaire de légumes ({{ inventoryLimit }} max)</h3>
      <div class="upgrade-section" v-if="nextInventoryUpgrade">
        <div class="upgrade-card">
          <div class="upgrade-info">
            <span class="upgrade-icon">🧺</span>
            <div class="upgrade-details">
              <span class="upgrade-name">Agrandir l'inventaire</span>
              <span class="upgrade-desc">{{ inventoryLimit }} → {{ nextInventoryUpgrade.to }} places</span>
            </div>
          </div>
          <BuyButton 
            :price="getUpgradePrice()"
            :onClick="onUpgradeInventory"
            :disabled="!canAffordUpgrade || loading"
          >
            Améliorer
          </BuyButton>
        </div>
      </div>
      <div v-else class="max-reached">
        ✅ Stockage maximum atteint !
      </div>
      
      
      <p class="shop-hint">
        💡 Les racines bizarres s'obtiennent en minant dans la roche dure!
      </p>
    </div>
  </Popup>
</template>

<script setup>
import { ref, computed } from 'vue'
import Popup from '@/components/menu/Popup.vue'
import BuyButton from '@/components/menu/BuyButton.vue'
import { useFarming } from '@/composables/useFarming'
import { useSound } from '@/composables/useSound'
import { useGameData } from '@/composables/useGameData'

const { shopBuy } = useSound()

const props = defineProps({
  strangeRoots: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close', 'purchase'])

const { farming: farmingData } = useGameData()

const { 
  buySeeds, 
  upgradeInventory, 
  discardVegetables,
  loading, 
  vegetables, 
  potathune, 
  inventoryLimit,
  nextInventoryUpgrade,
  farmLevel
} = useFarming()

// État local
const selectedDiscard = ref(null)
const discardQty = ref(1)
const seedPage = ref(0)
const seedsPerPage = 6

const seedTypes = computed(() => {
  const result = {}
  const vegetables = farmingData.value?.vegetables || {}
  const seedPrices = farmingData.value?.seedPrices || {}
  
  for (const [type, vegData] of Object.entries(vegetables)) {
    // Vérifier si les graines sont débloquées au niveau actuel
    if (vegData.unlock_level > farmLevel.value) continue
    
    const price = seedPrices[type]
    if (price) {
      const growthHours = Math.round(vegData.growthTime / (60 * 60 * 1000))
      const minigameNames = {
        minesweeper: 'Démineur',
        risk: 'Choix Risqué',
        falling: 'Attrape-Grains'
      }
      result[type] = {
        icon: `${vegData.icon}${vegData.seedIcon}`,
        vegIcon: vegData.icon,
        name: `Graines de ${vegData.name}`,
        description: vegData.description,
        growthTime: `${growthHours}h`,
        minigame: minigameNames[vegData.minigame] || vegData.minigame,
        minReward: vegData.minReward,
        maxReward: vegData.maxReward,
        price: price.count,
        seedsGiven: price.seedsGiven
      }
    }
  }
  
  return result
})

const vegetableTypes = computed(() => {
  const result = {}
  const vegetables = farmingData.value?.vegetables || {}
  
  for (const [type, vegData] of Object.entries(vegetables)) {
    // Vérifier si le légume est débloqué au niveau actuel
    if (vegData.unlock_level > farmLevel.value) continue
    
    result[type] = {
      icon: vegData.icon,
      name: vegData.name
    }
  }
  
  return result
})

const seedsToShow = computed(() => {
  const allSeeds = Object.entries(seedTypes.value)
  const start = seedPage.value * seedsPerPage
  return allSeeds.slice(start, start + seedsPerPage)
})

const totalSeedPages = computed(() => Math.ceil(Object.keys(seedTypes.value).length / seedsPerPage))

const canAffordUpgrade = computed(() => {
  if (!nextInventoryUpgrade.value) return false
  const cost = nextInventoryUpgrade.value.cost
  if (potathune.value < cost.potathune) return false
  // Note: ancient_urn check would need resources from somewhere
  return true
})

function getUpgradePrice() {
  if (!nextInventoryUpgrade.value) return []
  const cost = nextInventoryUpgrade.value.cost
  const prices = []
  
  // Ajouter potathune
  if (cost.potathune) {
    prices.push({ _iconOverride: '💵', count: cost.potathune })
  }
  
  // Ajouter urne antique si applicable
  if (cost.ancient_urn) {
    prices.push({ _iconOverride: '🏺', count: cost.ancient_urn })
  }
  
  // Si pas de coûts, retourner un array vide
  return prices.length > 0 ? prices : [{ _iconOverride: '💵', count: 0 }]
}

async function onBuy(vegetableType) {
  try {
    await buySeeds(vegetableType)
    shopBuy()
    emit('purchase')
  } catch (err) {
    console.error('Erreur d\'achat:', err)
    window.toast?.(err.message || 'Erreur d\'achat', 'error')
  }
}

async function onUpgradeInventory() {
  try {
    await upgradeInventory()
    shopBuy()
    window.toast?.('Inventaire agrandi !', 'success')
    emit('purchase')
  } catch (err) {
    console.error('Erreur d\'amélioration:', err)
    window.toast?.(err.message || 'Erreur d\'amélioration', 'error')
  }
}

async function onDiscard() {
  if (!selectedDiscard.value || discardQty.value < 1) return
  try {
    await discardVegetables(selectedDiscard.value, discardQty.value)
    window.toast?.(`${discardQty.value} légume(s) jeté(s)`, 'info')
    selectedDiscard.value = null
    discardQty.value = 1
    emit('purchase')
  } catch (err) {
    console.error('Erreur de suppression:', err)
    window.toast?.(err.message || 'Erreur', 'error')
  }
}
</script>

<style scoped>
.seed-shop {
  text-align: center;
}

.seed-shop h2 {
  margin: 0 0 12px 0;
  font-family: 'Fredoka', sans-serif;
  font-size: 20px;
  color: var(--button-text);
}

.roots-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 15px;
  background: rgba(139, 69, 19, 0.2);
  border-radius: 6px;
  margin-bottom: 12px;
}

.roots-icon {
  font-size: 22px;
}

.roots-count {
  font-family: 'Fredoka', sans-serif;
  font-size: 18px;
  font-weight: bold;
  color: var(--button-text);
}

.roots-label {
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  color: var(--button-text);
  opacity: 0.8;
}

.seeds-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
}

.page-btn {
  padding: 6px 12px;
  background: #7a3e10;
  border: 2px solid #ffc66e;
  color: #fff9e5;
  border-radius: 6px;
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #8a4a1c;
}

.page-btn:disabled {
  background: #5c2c08;
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  color: var(--button-text);
}

.seed-card {
  background: rgba(255, 248, 220, 0.5);
  border: 2px solid #DEB887;
  border-radius: 6px;
  padding: 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
}

.seed-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 4px;
}

.seed-icon {
  font-size: 20px;
}

.seed-name {
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  font-weight: bold;
  color: var(--button-text);
}

.seed-desc {
  margin: 0 0 8px 0;
  font-size: 11px;
  color: var(--button-text);
  opacity: 0.8;
}

.seed-info {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 4px;
  font-size: 10px;
  color: var(--button-text);
}

.seed-reward {
  font-family: 'Fredoka', sans-serif;
  font-size: 11px;
  color: #228B22;
  margin-bottom: 6px;
}

.seed-button-wrapper {
  display: flex;
}

/* Titres de section */
.section-title {
  margin: 15px 0 10px 0;
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  color: var(--button-text);
  text-align: left;
  border-bottom: 1px solid #DEB887;
  padding-bottom: 5px;
}

/* Section amélioration */
.upgrade-section {
  margin-bottom: 10px;
}

.upgrade-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(76, 175, 80, 0.1);
  border: 2px solid #4CAF50;
  border-radius: 8px;
}

.upgrade-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.upgrade-icon {
  font-size: 24px;
}

.upgrade-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.upgrade-name {
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  font-weight: bold;
  color: var(--button-text);
}

.upgrade-desc {
  font-size: 11px;
  color: #4CAF50;
}

.upgrade-cost {
  display: flex;
  gap: 8px;
  font-size: 12px;
  font-family: 'Fredoka', sans-serif;
}

.upgrade-btn {
  padding: 6px 12px;
  background: linear-gradient(145deg, #4CAF50, #388E3C);
  color: white;
  border: none;
  border-radius: 6px;
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
   cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
}

.upgrade-btn:disabled {
  background: #ccc;
  cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;

}

.max-reached {
  padding: 10px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 6px;
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  color: #4CAF50;
}

/* Section jeter légumes */
.discard-section {
  text-align: left;
}

.discard-info {
  font-size: 11px;
  color: var(--button-text);
  opacity: 0.8;
  margin-bottom: 8px;
}

.discard-grid {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.discard-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  background: #FFF8DC;
  border: 2px solid #DEB887;
  border-radius: 6px;
   cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: all 0.2s;
}

.discard-item:hover:not(.disabled) {
  border-color: #8B4513;
}

.discard-item.selected {
  border-color: #f44336;
  background: #ffebee;
}

.discard-item.disabled {
  opacity: 0.5;
      cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;

}

.discard-icon {
  font-size: 20px;
}

.discard-count {
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  font-weight: bold;
}

.discard-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #8B4513;
  color: white;
  border: none;
  font-size: 16px;
   cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  font-family: 'Fredoka', sans-serif;
}

.discard-qty {
  font-family: 'Fredoka', sans-serif;
  font-size: 16px;
  font-weight: bold;
  min-width: 30px;
  text-align: center;
}

.discard-btn {
  padding: 6px 16px;
  background: linear-gradient(145deg, #f44336, #d32f2f);
  color: white;
  border: none;
  border-radius: 6px;
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
   cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  margin-left: auto;
}

.discard-btn:disabled {
  background: #ccc;
  cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;

}

.shop-hint {
  margin: 10px 0 0 0;
  font-size: 11px;
  color: var(--button-text);
  opacity: 0.7;
  font-style: italic;
}

/* Responsive */
@media (max-width: 480px) {
  .seed-shop h2 {
    font-size: 18px;
    margin-bottom: 10px;
  }
  
  .roots-display {
    padding: 6px 12px;
    gap: 4px;
    margin-bottom: 10px;
  }
  
  .roots-icon {
    font-size: 18px;
  }
  
  .roots-count {
    font-size: 16px;
  }
  
  .roots-label {
    font-size: 10px;
  }
  
  .seeds-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .seed-card {
    padding: 10px;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  
  .seed-header {
    flex: 0 0 auto;
    margin-bottom: 0;
  }
  
  .seed-icon {
    font-size: 18px;
  }
  
  .seed-name {
    font-size: 13px;
  }
  
  .seed-info {
    flex: 0 0 auto;
    margin-bottom: 0;
  }
  
  .seed-reward {
    flex: 0 0 100%;
    margin-bottom: 4px;
    text-align: left;
  }
  
  .seed-button-wrapper {
    flex: 0 0 auto;
    margin-left: auto;
  }
  
  .shop-hint {
    font-size: 10px;
    margin-top: 8px;
  }
}

@media (max-width: 360px) {
  .seed-card {
    padding: 8px;
  }
  
  .seed-icon {
    font-size: 16px;
  }
  
  .seed-name {
    font-size: 11px;
  }
  
  .seed-info {
    font-size: 9px;
  }
  
  .seed-reward {
    font-size: 10px;
  }
}

/* Mode sombre */
:deep(.farming-view.dark-mode) .seed-shop {
  color: #E0E0E0;
}

:deep(.farming-view.dark-mode) .seed-shop h2,
:deep(.farming-view.dark-mode) .seed-shop h3 {
  color: #FFD700;
}

:deep(.farming-view.dark-mode) .roots-display {
  background: rgba(0, 0, 0, 0.3);
  border-color: #8B7355;
  color: #E0E0E0;
}

:deep(.farming-view.dark-mode) .seed-card {
  background: rgba(100, 100, 100, 0.2);
  border-color: #8B7355;
}

:deep(.farming-view.dark-mode) .seed-info {
  color: #C0C0C0;
}

:deep(.farming-view.dark-mode) .seed-reward {
  color: #C0C0C0;
}

:deep(.farming-view.dark-mode) .upgrade-card {
  background: rgba(100, 100, 100, 0.2);
  border-color: #8B7355;
}

:deep(.farming-view.dark-mode) .upgrade-name {
  color: #E0E0E0;
}

:deep(.farming-view.dark-mode) .upgrade-desc {
  color: #B0B0B0;
}

:deep(.farming-view.dark-mode) .discard-item {
  background: #3a3a3a;
  border-color: #8B7355;
  color: #E0E0E0;
}

:deep(.farming-view.dark-mode) .discard-item.selected {
  border-color: #ff6b6b;
  background: #4a2a2a;
}

:deep(.farming-view.dark-mode) .qty-btn {
  background: #8B6F47;
  color: white;
}

:deep(.farming-view.dark-mode) .shop-hint {
  color: #B0B0B0;
}
</style>
