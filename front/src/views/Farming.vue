<template>
  <div class="farming-view" :class="weatherClass">
    <!-- En-tête avec météo -->
    <div class="farming-header">
      <h1>Mon potager</h1>
      <WeatherDisplay :weather="weather" @refresh="fetchWeather" />
    </div>

    <div class="farming-content">
      <!-- Sidebar gauche: Graines -->
      <div class="sidebar seeds-sidebar">
        <h3 class="sidebar-title">Mes Graines</h3>
        <div class="seeds-list">
          <Tooltip 
            v-for="(seed, type) in seedsDisplay" 
            :key="type"
            :text="seed.tooltip"
            :forceHide="draggedSeed !== null"
          >
            <div 
              class="seed-item"
              :class="{ 'has-seeds': seeds[type] > 0, 'dragging': draggedSeed === type, 'touch-selected': touchSelectedSeed === type }"
              draggable="true"
              @dragstart="onDragStart($event, type)"
              @dragend="onDragEnd"
              @touchstart="onTouchStart($event, type)"
              @touchend="(e) => e.preventDefault()"
              @click="isMobile ? null : onSeedClick(type)"
            >
              <span class="seed-icon">🫘<span class="mini-icon">{{ seed.vegIcon }}</span></span>
              <span class="seed-count">{{ seeds[type] || 0 }}</span>
              <!-- Badge météo -->
              <span 
                v-if="seed.weatherEffect !== 0" 
                class="weather-badge"
                :class="seed.weatherEffect > 0 ? 'positive' : 'negative'"
              >
                {{ seed.weatherIcon }}
              </span>
            </div>
          </Tooltip>
        </div>
        <button class="shop-button" @click="open(); showShop = true">
          🛒 Boutique
        </button>
      </div>

      <!-- Grille centrale -->
      <div class="farm-grid-container">
        <div class="farm-grid">
          <div 
            v-for="slotIndex in 9" 
            :key="slotIndex - 1"
            class="farm-slot"
            :class="getSlotClass(slotIndex - 1)"
            @dragover="onDragOver($event, slotIndex - 1)"
            @drop="onDrop($event, slotIndex - 1)"
            @click="onSlotClick(slotIndex - 1)"
            @touchend="onTouchEnd($event, slotIndex - 1)"
          >
            <template v-if="isSlotUnlocked(slotIndex - 1)">
              <div v-if="getPlantation(slotIndex - 1)" class="plantation">
                <PlantationCell 
                  :plantation="getPlantation(slotIndex - 1)"
                  :weather="weather"
                  @harvest="onHarvest(slotIndex - 1)"
                />
              </div>
              <div v-else class="empty-slot" :class="{ 'touch-target': touchSelectedSeed }">
                <span class="empty-icon">🌱</span>
                <span class="empty-text">
                  <span v-if="touchSelectedSeed && isMobile" class="instruction-text">
                    Tap ici pour planter
                  </span>
                  <span v-else-if="isMobile" class="instruction-text">
                    Tap la graine
                  </span>
                  <span v-else class="instruction-text">
                    Plantez une graine ici
                  </span>
                </span>
              </div>
            </template>
            <template v-else>
              <div class="locked-slot" @click="onUnlockSlot(slotIndex - 1)">
                <span class="lock-icon">🔒</span>
                <span class="unlock-price">100 🥚</span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Sidebar droite: Légumes récoltés -->
      <div v-if="!isMobile" class="sidebar vegetables-sidebar">
        <h3 class="sidebar-title">Mes Légumes</h3>
        <div class="vegetables-list">
          <Tooltip 
            v-for="(veg, type) in vegetablesDisplay" 
            :key="type"
            :text="veg.tooltip"
          >
            <div class="vegetable-item" :class="{ 'has-vegetables': vegetables[type] > 0 }">
              <span class="vegetable-icon">{{ veg.icon }}</span>
              <span class="vegetable-count">{{ vegetables[type] || 0 }}</span>
            </div>
          </Tooltip>
        </div>
      </div>

      <!-- Bouton inventaire mobile -->
      <div v-if="isMobile" class="inventory-button-wrapper">
        <ActionButton :onClick="() => showInventory = true">
          Mes légumes
        </ActionButton>
      </div>
    </div>

    <!-- Popup inventaire (mobile) -->
    <Popup v-if="isMobile && showInventory" @close="showInventory = false">
      <h2 style="margin-top: 0; text-align: center;">Mon Inventaire</h2>
      <div class="vegetables-list" style="margin-top: 20px;">
        <div
          v-for="(veg, type) in vegetablesDisplay" 
          :key="type"
          class="vegetable-item large"
          :class="{ 'has-vegetables': vegetables[type] > 0 }"
        >
          <span class="vegetable-icon">{{ veg.icon }}</span>
          <span class="vegetable-count">{{ vegetables[type] || 0 }}</span>
          <p class="vegetable-name-inline">{{ veg.name }}</p>
        </div>
      </div>
    </Popup>

    <!-- Popup boutique -->
    <SeedShop 
      v-if="showShop" 
      @close="showShop = false"
      :strange-roots="strangeRoots"
      @purchase="onPurchase"
    />

    <!-- Mini-jeux -->
    <MinesweeperGame 
      v-if="activeMinigame === 'minesweeper'"
      :config="minigameConfig"
      :vegetable-data="minigameVegetable"
      @save-result="onSaveResult"
      @complete="onMinigameComplete"
      @close="cancelMinigame"
    />
    
    <CarrotRiskGame 
      v-if="activeMinigame === 'risk'"
      :config="minigameConfig"
      :vegetable-data="minigameVegetable"
      @save-result="onSaveResult"
      @complete="onMinigameComplete"
      @close="cancelMinigame"
    />
    
    <CornFallingGame 
      v-if="activeMinigame === 'falling'"
      :config="minigameConfig"
      :vegetable-data="minigameVegetable"
      @save-result="onSaveResult"
      @complete="onMinigameComplete"
      @close="cancelMinigame"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFarming } from '@/composables/useFarming'
import { useGameData } from '@/composables/useGameData'
import { useSound } from '@/composables/useSound'
import Tooltip from '@/components/menu/Tooltip.vue'
import WeatherDisplay from '@/components/farming/WeatherDisplay.vue'
import PlantationCell from '@/components/farming/PlantationCell.vue'
import SeedShop from '@/components/farming/SeedShop.vue'
import Popup from '@/components/menu/Popup.vue'
import ActionButton from '@/components/menu/ActionButton.vue'
import MinesweeperGame from '@/components/farming/MinesweeperGame.vue'
import CarrotRiskGame from '@/components/farming/CarrotRiskGame.vue'
import CornFallingGame from '@/components/farming/CornFallingGame.vue'

const { plantSeed: plantSeedSound, unlockSlot: unlockSlotSound, harvestReady, open, click } = useSound()

const {
  seeds,
  vegetables,
  unlockedSlots,
  plantations,
  strangeRoots,
  weather,
  loading,
  fetchState,
  fetchWeather,
  plantSeed,
  startHarvest,
  completeHarvest,
  unlockSlot,
  getPlantation,
  isSlotUnlocked
} = useFarming()

const { farming: farmingData } = useGameData()

// État local
const showShop = ref(false)
const showInventory = ref(false)
const draggedSeed = ref(null)
const touchSelectedSeed = ref(null) // Pour le mode tactile (mobile)
const activeMinigame = ref(null)
const minigameConfig = ref(null)
const minigameVegetable = ref(null)
const harvestingSlot = ref(null)
const isMobile = ref(false)

// Données d'affichage des graines avec effet météo
const seedsDisplay = computed(() => {
  const currentWeather = weather.value?.current
  const weatherEffects = currentWeather?.effects || {}
  const weatherIcon = currentWeather?.icon || ''
  
  const getSeedData = (type, vegIcon, name) => {
    const effect = weatherEffects[type] || 0
    let tooltip = `<strong>Graines de ${name}</strong><br>Temps de pousse: 3h`
    
    if (effect !== 0) {
      const sign = effect > 0 ? '+' : ''
      const effectText = effect > 0 ? 'Croissance accélérée' : 'Croissance ralentie'
      tooltip += `<br><br>${weatherIcon} <span style="color: ${effect > 0 ? '#4CAF50' : '#F44336'}">${effectText} (${sign}${Math.round(effect * 100)}%)</span>`
    }
    
    return {
      vegIcon,
      tooltip,
      weatherEffect: effect,
      weatherIcon
    }
  }
  
  return {
    potato: getSeedData('potato', '🥔', 'patate'),
    carrot: getSeedData('carrot', '🥕', 'carotte'),
    corn: getSeedData('corn', '🌽', 'maïs')
  }
})

// Classe CSS selon la météo
const weatherClass = computed(() => {
  const weatherId = weather.value?.current?.id
  if (weatherId) return `weather-${weatherId}`
  return ''
})

// Données d'affichage des légumes
const vegetablesDisplay = computed(() => ({
  potato: {
    icon: '🥔',
    name: 'Patate',
    tooltip: `<strong>Patates</strong><br>Vous en avez: ${vegetables.value.potato || 0}`
  },
  carrot: {
    icon: '🥕',
    name: 'Carotte',
    tooltip: `<strong>Carottes</strong><br>Vous en avez: ${vegetables.value.carrot || 0}`
  },
  corn: {
    icon: '🌽',
    name: 'Maïs',
    tooltip: `<strong>Maïs</strong><br>Vous en avez: ${vegetables.value.corn || 0}`
  }
}))

// Drag & Drop
function onDragStart(event, seedType) {
  if ((seeds.value[seedType] || 0) < 1) {
    event.preventDefault()
    return
  }
  draggedSeed.value = seedType
  event.dataTransfer.setData('text/plain', seedType)
  event.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  draggedSeed.value = null
}

// Support tactile (mobile) - sélection par tap UNIQUEMENT sur mobile
function onTouchStart(event, seedType) {
  // Sélectionner uniquement sur mobile
  if (!isMobile.value || (seeds.value[seedType] || 0) < 1) return
  touchSelectedSeed.value = seedType
}

function onSeedClick(seedType) {
  if ((seeds.value[seedType] || 0) < 1) return
  
  // Sur mobile: toggle la sélection
  if (isMobile.value) {
    if (touchSelectedSeed.value === seedType) {
      touchSelectedSeed.value = null
    } else {
      touchSelectedSeed.value = seedType
    }
  }
}

async function onTouchEnd(event, slotIndex) {
  // Planter seulement sur mobile ET avec une graine sélectionnée
  if (!isMobile.value || !touchSelectedSeed.value) return
  if (!isSlotUnlocked(slotIndex)) return
  if (getPlantation(slotIndex)) return
  
  try {
    await plantSeed(slotIndex, touchSelectedSeed.value)
    plantSeedSound()
    touchSelectedSeed.value = null
  } catch (err) {
    console.error('Erreur de plantation:', err)
  }
}

function onDragOver(event, slotIndex) {
  if (!draggedSeed.value) return
  if (!isSlotUnlocked(slotIndex)) return
  if (getPlantation(slotIndex)) return
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

async function onDrop(event, slotIndex) {
  event.preventDefault()
  const seedType = event.dataTransfer.getData('text/plain')
  if (!seedType) return
  
  try {
    await plantSeed(slotIndex, seedType)
    plantSeedSound()
  } catch (err) {
    console.error('Erreur de plantation:', err)
  }
  
  draggedSeed.value = null
}

// Actions sur les slots
function onSlotClick(slotIndex) {
  const plantation = getPlantation(slotIndex)
  if (plantation && new Date(plantation.readyAt) <= new Date()) {
    harvestReady()
    onHarvest(slotIndex)
  }
}

async function onHarvest(slotIndex) {
  try {
    const data = await startHarvest(slotIndex)
    harvestingSlot.value = slotIndex
    activeMinigame.value = data.minigame
    minigameConfig.value = data.minigameConfig
    minigameVegetable.value = data.vegetableData
  } catch (err) {
    console.error('Erreur de récolte:', err)
  }
}

// Sauvegarde le résultat sans fermer le popup (pour éviter perte si actualisation)
async function onSaveResult(reward) {
  try {
    await completeHarvest(harvestingSlot.value, reward)
  } catch (err) {
    console.error('Erreur de sauvegarde:', err)
  }
}

// Ferme le popup après que le joueur ait cliqué sur "Récupérer"
function onMinigameComplete() {
  activeMinigame.value = null
  minigameConfig.value = null
  minigameVegetable.value = null
  harvestingSlot.value = null
}

function cancelMinigame() {
  // Si on annule, on ne récolte rien mais la plante reste
  activeMinigame.value = null
  minigameConfig.value = null
  minigameVegetable.value = null
  harvestingSlot.value = null
}

async function onUnlockSlot(slotIndex) {
  if (isSlotUnlocked(slotIndex)) return
  try {
    await unlockSlot(slotIndex)
    unlockSlotSound()
  } catch (err) {
    console.error('Erreur de déblocage:', err)
  }
}

async function onPurchase() {
  // Rafraîchir après achat
  await fetchState()
}

function getSlotClass(slotIndex) {
  const classes = []
  if (isSlotUnlocked(slotIndex)) {
    classes.push('unlocked')
    const plantation = getPlantation(slotIndex)
    if (plantation) {
      classes.push('has-plant')
      if (new Date(plantation.readyAt) <= new Date()) {
        classes.push('ready')
      }
    } else if (draggedSeed.value) {
      classes.push('drop-target')
    }
  } else {
    classes.push('locked')
  }
  return classes
}

// Rafraîchir la météo périodiquement
let weatherInterval = null

// Déterminer si on est sur mobile
function checkMobile() {
  isMobile.value = window.innerWidth <= 768 || 'ontouchstart' in window
}

onMounted(async () => {
  // Déterminer si mobile
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  try {
    await fetchState()
  } catch (err) {
    console.error('Erreur de chargement:', err)
  }
  
  // Rafraîchir la météo toutes les minutes
  weatherInterval = setInterval(() => {
    fetchWeather()
  }, 60000)
})

onUnmounted(() => {
  if (weatherInterval) {
    clearInterval(weatherInterval)
  }
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.farming-view {
  min-height: 100vh;
  padding: 20px;
  padding-bottom: 100px;
  background: linear-gradient(180deg, #B8E6B0 0%, #8BC883 50%, #6B9E65 100%);
  cursor: url('@/assets/ui/cursor/hand_point.png') 0 0, auto;
  transition: background 0.5s ease;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Météo ensoleillée */
.farming-view.weather-sunny {
  background: linear-gradient(180deg, #FFE4B5 0%, #F4D58A 50%, #C9A95E 100%);
}

/* Météo nuageuse */
.farming-view.weather-cloudy {
  background: linear-gradient(180deg, #D3D3D3 0%, #A9C4A9 50%, #7A9E7A 100%);
}

/* Météo pluvieuse */
.farming-view.weather-rainy {
  background: linear-gradient(180deg, #A8C8D8 0%, #7BA3B8 50%, #5A8090 100%);
}

.farming-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 8px 15px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  border: 2px solid #8B4513;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.farming-header h1 {
  margin: 0;
  font-family: 'Fredoka', sans-serif;
  font-size: 20px;
  color: #5D4037;
}

.farming-content {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
}

/* Sidebars */
.sidebar {
  width: 140px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  border: 3px solid #8B4513;
  padding: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.sidebar-title {
  margin: 0 0 15px 0;
  font-family: 'Fredoka', sans-serif;
  font-size: 16px;
  color: #5D4037;
  text-align: center;
  border-bottom: 2px solid #DEB887;
  padding-bottom: 10px;
}

.seeds-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.vegetables-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.seed-item, .vegetable-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: #FFF8DC;
  border-radius: 6px;
  border: 2px solid #DEB887;
  transition: border-color 0.2s ease;
  flex-direction: column;
  gap: 2px;
  position: relative;
}

.seed-item {
  cursor: url('@/assets/ui/cursor/hand_open.png') 0 0, pointer;
}

.seed-item:active { 
     cursor: url('@/assets/ui/cursor/hand_closed.png') 0 0, pointer;
}

.seed-icon {
  position: relative;
  font-size: 28px;
  line-height: 1;
}

.seed-icon .mini-icon {
  position: absolute;
  font-size: 14px;
  bottom: -4px;
  right: -8px;
}

.seed-count, .vegetable-count {
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  font-weight: bold;
  color: #5D4037;
}

.seed-item.has-seeds {
  border-color: #8B4513;
  background: #FFFACD;
}

.seed-item.has-seeds:hover {
  border-color: #654321;
}

.seed-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.seed-item.touch-selected {
  border-color: #4CAF50;
  background: #E8F5E9;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3);
  animation: pulse-selection 1s infinite;
}

@keyframes pulse-selection {
  0%, 100% { box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3); }
  50% { box-shadow: 0 0 0 5px rgba(76, 175, 80, 0.5); }
}

.seed-item:not(.has-seeds) {
  opacity: 0.5;  
  cursor: url('@/assets/ui/cursor/disabled.png') 0 0, pointer;
}

/* Badge météo */
.weather-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  font-size: 12px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.weather-badge.positive {
  background: #C8E6C9;
  border-color: #4CAF50;
}

.weather-badge.negative {
  background: #FFCDD2;
  border-color: #F44336;
}

.vegetable-item {
  padding: 8px;
  flex-direction: column;
  gap: 2px;
}

.vegetable-item.large {
  width: 70px;
  height: 70px;
  padding: 12px;
  position: relative;
}

.vegetable-item-with-name {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.vegetable-name {
  margin: 0;
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  color: #5D4037;
  text-align: center;
  font-weight: 500;
}

.vegetable-name-inline {
  position: absolute;
  bottom: 2px;
  left: 0;
  right: 0;
  margin: 0;
  font-family: 'Fredoka', sans-serif;
  font-size: 10px;
  color: #5D4037;
  text-align: center;
  font-weight: 600;
  line-height: 1;
}

.vegetable-item.has-vegetables {
  border-color: #228B22;
  background: #F0FFF0;
}

.vegetable-icon {
  font-size: 24px;
}

.shop-button {
  width: 100%;
  margin-top: 15px;
  padding: 12px;
  background: #8B4513;
  color: white;
  border: none;
  border-radius: 6px;
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: all 0.2s ease;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.shop-button:hover {
  background: #A0522D;
  transform: translateY(-2px);
}

.strange-roots-display {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #DEB887;
}

.resource-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: #F5DEB3;
  border-radius: 6px;
  border: 2px solid #8B4513;
}

.resource-icon {
  font-size: 24px;
}

.resource-count {
  font-family: 'Fredoka', sans-serif;
  font-size: 18px;
  font-weight: bold;
  color: #5D4037;
}

/* Grille de la ferme */
.farm-grid-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.farm-grid {
  display: grid;
  grid-template-columns: repeat(3, 140px);
  grid-template-rows: repeat(3, 140px);
  gap: 12px;
  padding: 20px;
  background: rgba(139, 69, 19, 0.3);
  border-radius: 10px;
  border: 4px solid #8B4513;
  box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.15);
}

.farm-slot {
  background: #8B7355;
  border-radius: 6px;
  border: 3px solid #654321;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.farm-slot.unlocked {
  background: #A0826D;
}

.farm-slot.unlocked.drop-target {
  background: #7CB342;
  border-color: #228B22;
  box-shadow: 0 0 10px rgba(34, 139, 34, 0.4);
}

.farm-slot.has-plant {
  background: #6D5D4D;
  cursor: url('@/assets/ui/cursor/hand_point.png') 0 0, pointer;
}

.farm-slot.has-plant:hover {
  background: #7D6D5D;
}

.farm-slot.ready {
  border-color: #FFD700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
}

.farm-slot.locked {
  background: #5A5A5A;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
}

.farm-slot.locked:hover {
  background: #6A6A6A;
}

.empty-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: #DEB887;
  opacity: 0.7;
}

.empty-slot.touch-target {
  opacity: 1;
  color: #4CAF50;
  animation: pulse-target 1s infinite;
}

@keyframes pulse-target {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.empty-icon {
  font-size: 32px;
}

.empty-text {
  font-family: 'Fredoka', sans-serif;
  font-size: 11px;
  text-align: center;
  line-height: 1.2;
}

.instruction-text {
  display: block;
}

.locked-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: #A9A9A9;
}

.lock-icon {
  font-size: 32px;
}

.unlock-price {
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 8px;
  border-radius: 6px;
}

.plantation {
  width: 100%;
  height: 100%;
}

/* Inventaire popup (mobile) */
.inventory-button-wrapper {
  margin-top: 8px;
  margin-bottom: -8px;
}

.inventory-popup {
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

.inventory-content {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  border: 3px solid #8B4513;
  padding: 20px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #DEB887;
}

.inventory-header h2 {
  margin: 0;
  font-family: 'Fredoka', sans-serif;
  font-size: 20px;
  color: #5D4037;
}

.inventory-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #8B4513;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.inventory-close:hover {
  color: #5D4037;
  transform: scale(1.2);
}

/* Responsive */
@media (max-width: 900px) {
  .farming-content {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }
  
  .sidebar {
    width: 100%;
    max-width: 420px;
    padding: 10px;
  }
  
  .sidebar-title {
    font-size: 14px;
    margin-bottom: 8px;
  }
  
  .seeds-list, .vegetables-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
  
  .seed-item, .vegetable-item {
    flex: 0 0 auto;
    width: 65px;
    height: 65px;
  }
  
  .shop-button {
    margin-top: 10px;
    width: 100%;
    max-width: 200px;
  }
}

@media (max-width: 600px) {
  .farming-view {
    padding: 8px;
    padding-bottom: 80px;
    overflow-y: auto;
  }
  
  .farming-header {
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    margin-bottom: 10px;
    max-width: 100%;
  }
  
  .farming-header h1 {
    font-size: 20px;
  }
  
  .farming-content {
    width: 100%;
    max-width: calc(100% - 4px);
    box-sizing: border-box;
  }
  
  .farm-grid {
    grid-template-columns: repeat(3, 100px);
    grid-template-rows: repeat(3, 100px);
    gap: 6px;
    padding: 10px;
  }
  
  .farm-slot {
    border-radius: 6px;
  }
  
  .empty-icon {
    font-size: 26px;
  }
  
  .empty-text {
    font-size: 10px;
  }
  
  .lock-icon {
    font-size: 26px;
  }
  
  .unlock-price {
    font-size: 11px;
    padding: 2px 5px;
  }
  
  .sidebar {
    padding: 8px;
    width: 100%;
    max-width: 90%;
    margin-left: auto;
    margin-right: auto;
    box-sizing: border-box;
  }
  
  .sidebar-title {
    font-size: 13px;
    margin-bottom: 6px;
  }
  
  .seed-item, .vegetable-item {
    width: 55px;
    height: 55px;
  }
  
  .seed-icon, .vegetable-icon {
    font-size: 22px;
  }
  
  .seed-count, .vegetable-count {
    font-size: 11px;
    padding: 2px 4px;
    min-width: 16px;
  }
  
  .mini-icon {
    font-size: 10px;
    right: -3px;
    bottom: -3px;
  }
  
  .weather-badge {
    font-size: 10px;
    width: 16px;
    height: 16px;
  }
  
  .shop-button {
    margin-top: 8px;
    padding: 10px 16px;
    font-size: 12px;
    width: 100%;
  }
}

@media (max-width: 400px) {
  .farming-view {
    padding: 6px;
    padding-bottom: 70px;
    overflow-y: auto;
  }
  
  .farming-header {
    padding: 6px;
    gap: 6px;
    margin-bottom: 8px;
  }
  
  .farming-header h1 {
    font-size: 18px;
  }
  
  .farming-content {
    width: 100%;
    max-width: 100%;
    gap: 8px;
  }
  
  .farm-grid {
    grid-template-columns: repeat(3, 85px);
    grid-template-rows: repeat(3, 85px);
    gap: 5px;
    padding: 8px;
  }
  
  .empty-icon {
    font-size: 22px;
  }
  
  .empty-text {
    font-size: 8px;
  }
  
  .lock-icon {
    font-size: 22px;
  }
  
  .unlock-price {
    font-size: 9px;
    padding: 2px 4px;
  }
  
  .sidebar {
    padding: 6px;
    width: 100%;
    max-width: 100%;
  }
  
  .sidebar-title {
    font-size: 12px;
    margin-bottom: 6px;
    padding-bottom: 6px;
  }
  
  .seed-item, .vegetable-item {
    width: 50px;
    height: 50px;
  }
  
  .seed-icon, .vegetable-icon {
    font-size: 20px;
  }
  
  .seed-count, .vegetable-count {
    font-size: 10px;
  }
  
  .shop-button {
    padding: 8px 12px;
    font-size: 11px;
    margin-top: 6px;
    width: 100%;
  }
}

/* Orientation paysage sur mobile */
@media (max-height: 500px) and (orientation: landscape) {
  .farming-view {
    padding: 5px;
    padding-bottom: 60px;
  }
  
  .farming-header {
    padding: 5px 10px;
    margin-bottom: 5px;
  }
  
  .farming-header h1 {
    font-size: 16px;
  }
  
  .farming-content {
    flex-direction: row;
    align-items: flex-start;
    gap: 10px;
  }
  
  .sidebar {
    max-width: 120px;
    padding: 5px;
  }
  
  .sidebar-title {
    font-size: 11px;
  }
  
  .seeds-list, .vegetables-list {
    gap: 4px;
  }
  
  .seed-item, .vegetable-item {
    width: 45px;
    height: 45px;
  }
  
  .seed-icon, .vegetable-icon {
    font-size: 18px;
  }
  
  .seed-count, .vegetable-count {
    font-size: 10px;
    min-width: 14px;
  }
  
  .farm-grid {
    grid-template-columns: repeat(3, 80px);
    grid-template-rows: repeat(3, 80px);
    gap: 5px;
    padding: 8px;
  }
  
  .empty-icon {
    font-size: 22px;
  }
  
  .empty-text {
    font-size: 8px;
  }
  
  .shop-button {
    padding: 6px 12px;
    font-size: 11px;
  }
}
</style>
