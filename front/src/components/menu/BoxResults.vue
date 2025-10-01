<template>
  <div v-if="showResults" class="popup-overlay" @click.self="closeResults">
    <div class="popup-content">
      <button class="close-btn" @click="closeResults">✕</button>
      
      <div class="results-header">
        <h3>🎉 Résultats de {{ boxName }}</h3>
      </div>
      
      <div class="results-content">
        <div v-if="results.length === 0" class="no-results">
          <p>😢 Aucune poule obtenue cette fois...</p>
        </div>
        
        <div v-else class="chicken-results">
          <div 
            v-for="(result, index) in results" 
            :key="index"
            :class="['result-item', `rarity-${result.rarete}`, { 'epic-appear': result.rarete === 'epique' }]"
          >
            <div class="result-icon">
              <span v-if="result.isNew" class="new-badge">NOUVEAU!</span>
              <img 
                :src="getImage(result.especeId)" 
                :alt="result.nom"
                @error="onImageError"
              />
            </div>
            
            <div class="result-info">
              <h4 :style="{ color: getRarityColor(result.rarete) }">
                {{ result.nom }}
              </h4>
              <p class="result-rarity">{{ getRarityLabel(result.rarete) }}</p>
              <p class="result-group">Groupe: {{ result.groupe }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="results-footer">
        <ActionButton :onClick="closeResults">
          Continuer
        </ActionButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ActionButton from './ActionButton.vue'
import { usePoules } from '@/composables/usePoules'

const props = defineProps({
  showResults: {
    type: Boolean,
    default: false
  },
  results: {
    type: Array,
    default: () => []
  },
  boxName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])
const { getImage, hiddenImage } = usePoules()

function closeResults() {
  emit('close')
}

function getRarityColor(rarity) {
  switch(rarity) {
    case 'commune': return '#95a5a6'
    case 'rare': return '#3498db'
    case 'epique': return '#9b59b6'
    case 'legendaire': return '#f39c12'
    default: return '#6d3c00'
  }
}

function getRarityLabel(rarity) {
  switch(rarity) {
    case 'commune': return 'Commune'
    case 'rare': return 'Rare'
    case 'epique': return 'Épique'
    case 'legendaire': return 'Légendaire'
    default: return 'Inconnue'
  }
}

function onImageError(event) {
  // Image de fallback en cas d'erreur
  event.target.src = hiddenImage
}
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(20, 10, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.popup-content {
  background: #f4f1e8;
  border: 3px solid #8B4513;
  border-radius: 20px;
  padding: 24px;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  font-family: 'Fredoka', sans-serif;
  color: #2F1B14;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  position: relative;
  animation: popupEnter 0.25s ease-out;
  box-sizing: border-box;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  font-size: 20px;
  color: #8B4513;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  font-weight: bold;
}

@keyframes popupEnter {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.results-header {
  text-align: center;
  margin-bottom: 20px;
}

.results-header h3 {
  margin: 0;
  color: #8B4513;
  font-size: 18px;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
}

.results-content {
  margin-bottom: 20px;
}

.no-results {
  text-align: center;
  color: #8B4513;
  font-size: 16px;
}

.chicken-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  border: 2px solid;
  position: relative;
  animation: bounceIn 0.5s ease;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(240, 230, 210, 0.9) 100%);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.result-item.rarity-commune {
  border-color: #c2c2c2;
}

.result-item.rarity-rare {
  border-color: #7bc0ff;
}

.result-item.rarity-epique {
  border-color: #c98bff;
}

/* Animation mise en avant pour l'épique au drop */
.epic-appear {
  animation: epicCard 900ms ease-out both;
  box-shadow: 0 0 16px rgba(155, 89, 182, 0.35), inset 0 0 8px rgba(155, 89, 182, 0.15);
}
@keyframes epicCard {
  0% { transform: scale(0.85) rotate(-2deg); filter: saturate(0.9); }
  40% { transform: scale(1.08) rotate(1deg); filter: saturate(1.2); }
  70% { transform: scale(1.02) rotate(0deg); }
  100% { transform: scale(1); }
}

.result-item.rarity-legendaire {
  border-color: gold;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
}

.result-icon {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.result-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #8B4513;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.new-badge {
  position: absolute;
  top: -6px;
  left: -6px;
  background: #e74c3c;
  color: white;
  font-size: 8px;
  font-weight: bold;
  padding: 2px 4px;
  border-radius: 4px;
  z-index: 10;
  transform: rotate(-12deg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.result-info {
  flex: 1;
}

.result-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: bold;
  color: #2F1B14;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
}

.result-rarity {
  margin: 0 0 4px 0;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  color: #8B4513;
}

.result-group {
  margin: 0;
  font-size: 11px;
  color: #A0522D;
}

.results-footer {
  text-align: center;
  margin-top: 16px;
  position: sticky;
  bottom: 0;
  background: linear-gradient(180deg, rgba(244,241,232,0.6) 0%, #f4f1e8 60%);
  padding-top: 8px;
  padding-bottom: 6px;
  border-top: 1px solid rgba(139, 69, 19, 0.25);
}

/* Styles responsive */
@media (max-width: 768px) {
  .popup-content {
    width: 95%;
    margin: 20px;
  }
  
  .result-item {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .result-info {
    text-align: center;
  }
  
  .result-icon {
    width: 40px;
    height: 40px;
  }
}
</style>