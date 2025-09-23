<template>
  <button
    class="buy-button"
    :class="{ disabled }"
    @click="!disabled && onClick()"
    :disabled="disabled"
  >
    <div class="button-content">
      <span class="button-text">
        <slot></slot>
      </span>
      <div class="price-display" v-if="price">
        <span class="price-icon">{{ getPriceIcon() }}</span>
        <span class="price-amount">{{ price.count || price }}</span>
      </div>
    </div>
  </button>
</template>

<script setup>
const props = defineProps({
  onClick: Function,
  disabled: Boolean,
  price: [Object, Number] // Peut être un nombre (œufs) ou un objet { type: 'eggs|stock_token|production_token', count: number }
})

function getPriceIcon() {
  if (typeof props.price === 'number') {
    return '🥚'
  }
  
  switch (props.price.type) {
    case 'eggs':
      return '🥚'
    case 'stock_token':
      return '📦'
    case 'production_token':
      return '⚡'
    default:
      return '🥚'
  }
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

.button-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

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

/* Variante pour boutons désactivés */
.buy-button.disabled .price-display {
  background: rgba(255, 255, 255, 0.1);
}

.buy-button.disabled .price-amount {
  color: #999;
}
</style>