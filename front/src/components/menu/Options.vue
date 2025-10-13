<template>
  <Popup v-if="visible" @close="emit('close')">
    <h2>⚙️ Options</h2>

    <div class="option-line">
      <label class="volume-slider-label" for="volume-slider">🔊 Volume</label>
      <input
        id="volume-slider"
        type="range"
        min="0"
        max="100"
        v-model.number="settings.volume"
        style="flex: 1;"
      />
      <span>{{ settings.volume }}%</span>
    </div>

    <!--div class="option-line">
      <label for="buffs-everywhere-toggle">Buffs visibles partout</label>
      <input
        id="buffs-everywhere-toggle"
        type="checkbox"
        v-model="settings.buffsEverywhere"
        style="width: 20px; height: 20px; accent-color: #ffd700; margin-left: 8px;"
      />
    </div-->

    <br>
    <ActionButton
      :onClick="() => emit('logout')"
      style="display: block; margin: 10px auto;"
    >
      🚪 Déconnexion
    </ActionButton>
  </Popup>
</template>

<script setup>
import { onMounted } from 'vue'
import { useSettings } from '@/composables/useSettings'
import Popup from '@/components/menu/Popup.vue'
import ActionButton from '@/components/menu/ActionButton.vue'

defineProps({
  visible: Boolean
})

const { settings, fetchSettings } = useSettings()
const emit = defineEmits(['close','logout'])

onMounted(() => {
  fetchSettings().catch(() => {})
})
</script>

<style scoped>
.option-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Fredoka', sans-serif;
  color: #fff9e5;
  margin-top: 12px;
  font-size: 16px;
}

input[type="range"] {
  accent-color: orange;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
}

.volume-slider-label {
  cursor: url('@/assets/ui/cursor/hand_point.png') 0 0, auto;
}
</style>