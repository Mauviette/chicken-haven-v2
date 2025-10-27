<template>
  <button
    class="buy-button"
    :class="{ disabled }"
    @click="handleClick"
    :disabled="disabled"
    :title="title || ''"
  >
    <div class="button-content">
      <span class="button-text">
        <slot></slot>
      </span>
      <template v-if="Array.isArray(price)">
        <div class="price-list">
          <div v-for="(p, idx) in price" :key="idx" class="price-display" :class="{ 'insufficient': insufficient?.includes(idx) }">
            <span class="price-icon">{{ p._iconOverride || getPriceIcon(p) }}</span>
            <span class="price-amount">{{ formatNumber(p.count || p) }}</span>
          </div>
        </div>
      </template>
      <div class="price-display" v-else-if="price">
        <span class="price-icon">{{ getPriceIcon(price) }}</span>
        <span class="price-amount">{{ formatNumber(price.count || price) }}</span>
      </div>
    </div>
  </button>
</template>

<script setup>
import { useSound } from '@/composables/useSound'
import { useGameData } from '@/composables/useGameData'
import { formatNumber } from '@/utils/format.js'

const props = defineProps({
  onClick: Function,
  disabled: Boolean,
  price: [Object, Number, Array], // Peut être un nombre, un objet { type, count } ou un tableau de prix
  title: String,
  insufficient: Array // Tableau d'indices des ressources insuffisantes
})

const { click } = useSound()
const { items } = useGameData()

function handleClick() {
  if (props.disabled) return
  click()
  props.onClick && props.onClick()
}

function getPriceIcon(price = props.price) {
  const itemsData = items.value
  if (typeof price === 'number') {
    return itemsData?.eggs?.icon || '🥚'
  }
  if (price && typeof price === 'object' && price.type) {
    return itemsData?.[price.type]?.icon || itemsData?.eggs?.icon || '🥚'
  }
  return itemsData?.eggs?.icon || '🥚'
}
</script>

<style scoped>
.buy-button {
  background-color: #7a3e10;
  border: 2px solid #ffc66e;
  color: #fff9e5;
  border-radius: 10px;
  padding: 8px 12px;
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: transform 0.1s ease;
  min-width: 100px;
}

.buy-button:hover:not(.disabled) {
  background-color: #8a4a1c;
  transform: translateY(-1px);
}

.buy-button:active:not(.disabled) {
  transform: translateY(2px);
  box-shadow: 0 0px 0 #5c2c08;
}

.buy-button.disabled {
  background-color: #5c2c08;
  color: #bbb;
  cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;
  opacity: 0.7;
}

.button-content { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.price-list { display: flex; flex-direction: row; align-items: center; gap: 6px; }

.button-text {
  font-weight: bold;
  font-size: 12px;
}

.price-display {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: bold;
}

.price-icon {
  font-size: 12px;
}

.price-amount {
  color: #fff9e5;
}

.price-display.insufficient .price-amount {
  color: #ff6b6b;
}

/* Mode Apocalypse */
.apocalypse-mode .buy-button {
  background-color: #662222;
  border: 2px solid #ff6666;
  color: #ffaaaa;
}

.apocalypse-mode .buy-button:hover:not(.disabled) {
  background-color: #883333;
}

.apocalypse-mode .buy-button.disabled {
  background-color: #441111;
  color: #996666;
}

.apocalypse-mode .price-display {
  background: rgba(255, 102, 102, 0.2);
}

.apocalypse-mode .price-amount {
  color: #ffaaaa;
}

.apocalypse-mode .price-display.insufficient .price-amount {
  color: #ff4444;
}

</style>