<template>
  <Popup @close="$emit('close')">
    <div class="seed-shop">
      <h2>🛒 Boutique de Graines</h2>
      
      <div class="roots-display">
        <span class="roots-icon">🫚</span>
        <span class="roots-count">{{ strangeRoots }}</span>
        <span class="roots-label">racines bizarres</span>
      </div>
      
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
      
      <p class="shop-hint">
        💡 Astuce: Les racines bizarres s'obtiennent en minant dans la roche dure!
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

const { buySeeds, loading } = useFarming()

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

async function onBuy(vegetableType) {
  try {
    await buySeeds(vegetableType)
    shopBuy()
    emit('purchase')
  } catch (err) {
    console.error('Erreur d\'achat:', err)
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
