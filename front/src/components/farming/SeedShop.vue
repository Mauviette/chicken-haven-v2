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
      <h3 class="section-title">🌱 Graines</h3>
      <div class="seeds-grid">
        <div v-for="(seed, type) in seedTypes" :key="type" class="seed-card">
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
              :disabled="strangeRoots < 1 || loading"
              :price="{ type: 'strange_root', count: 1, _iconOverride: '🫚' }"
            >
              Acheter 2 graines
            </BuyButton>
          </div>
        </div>
      </div>
      
      <!-- Section Améliorations -->
      <h3 class="section-title">📦 Stockage ({{ inventoryLimit }} max)</h3>
      <div class="upgrade-section" v-if="nextInventoryUpgrade">
        <div class="upgrade-card">
          <div class="upgrade-info">
            <span class="upgrade-icon">📦</span>
            <div class="upgrade-details">
              <span class="upgrade-name">Agrandir l'inventaire</span>
              <span class="upgrade-desc">{{ inventoryLimit }} → {{ nextInventoryUpgrade.to }} places</span>
            </div>
          </div>
          <div class="upgrade-cost">
            <span>💵 {{ nextInventoryUpgrade.cost.potathune }}</span>
            <span v-if="nextInventoryUpgrade.cost.ancient_urn">🏺 {{ nextInventoryUpgrade.cost.ancient_urn }}</span>
          </div>
          <button 
            class="upgrade-btn"
            :disabled="!canAffordUpgrade || loading"
            @click="onUpgradeInventory"
          >
            Améliorer
          </button>
        </div>
      </div>
      <div v-else class="max-reached">
        ✅ Stockage maximum atteint !
      </div>
      
      <!-- Section Jeter des légumes -->
      <h3 class="section-title">🗑️ Jeter des légumes</h3>
      <div class="discard-section">
        <div class="discard-info">Sélectionnez un légume à jeter pour libérer de l'espace</div>
        <div class="discard-grid">
          <div 
            v-for="(veg, type) in vegetableTypes" 
            :key="type"
            class="discard-item"
            :class="{ 'selected': selectedDiscard === type, 'disabled': vegetables[type] < 1 }"
            @click="vegetables[type] > 0 && (selectedDiscard = type)"
          >
            <span class="discard-icon">{{ veg.icon }}</span>
            <span class="discard-count">{{ vegetables[type] || 0 }}</span>
          </div>
        </div>
        <div v-if="selectedDiscard" class="discard-controls">
          <button class="qty-btn" @click="discardQty = Math.max(1, discardQty - 1)">-</button>
          <span class="discard-qty">{{ discardQty }}</span>
          <button class="qty-btn" @click="discardQty = Math.min(vegetables[selectedDiscard], discardQty + 1)">+</button>
          <button 
            class="discard-btn"
            :disabled="loading || discardQty < 1"
            @click="onDiscard"
          >
            Jeter
          </button>
        </div>
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

const { shopBuy } = useSound()

const props = defineProps({
  strangeRoots: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close', 'purchase'])

const { 
  buySeeds, 
  upgradeInventory, 
  discardVegetables,
  loading, 
  vegetables, 
  potathune, 
  inventoryLimit,
  nextInventoryUpgrade
} = useFarming()

// État local
const selectedDiscard = ref(null)
const discardQty = ref(1)

const seedTypes = computed(() => ({
  potato: {
    icon: '🥔🫘',
    vegIcon: '🥔',
    name: 'Graines de Patate',
    description: 'Des graines magiques pour faire pousser des patates.',
    growthTime: '3h',
    minigame: 'Démineur',
    minReward: 1,
    maxReward: 3
  },
  carrot: {
    icon: '🥕🫘',
    vegIcon: '🥕',
    name: 'Graines de Carotte',
    description: 'Des graines magiques pour faire pousser des carottes.',
    growthTime: '3h',
    minigame: 'Choix Risqué',
    minReward: 0,
    maxReward: 4
  },
  corn: {
    icon: '🌽🫘',
    vegIcon: '🌽',
    name: 'Graines de Maïs',
    description: 'Des graines magiques pour faire pousser du maïs.',
    growthTime: '3h',
    minigame: 'Attrape-Grains',
    minReward: 1,
    maxReward: 3
  }
}))

const vegetableTypes = {
  potato: { icon: '🥔', name: 'Patate' },
  carrot: { icon: '🥕', name: 'Carotte' },
  corn: { icon: '🌽', name: 'Maïs' }
}

const canAffordUpgrade = computed(() => {
  if (!nextInventoryUpgrade.value) return false
  const cost = nextInventoryUpgrade.value.cost
  if (potathune.value < cost.potathune) return false
  // Note: ancient_urn check would need resources from somewhere
  return true
})

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
  cursor: not-allowed;
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
  cursor: not-allowed;
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
  cursor: not-allowed;
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
</style>
