<template>
  <Popup v-if="visible" @close="emit('close')">
    <h2>⚙️ Options</h2>
    <!--label class="option-line pointer">
      <input type="checkbox" v-model="settings.sound" />
      Activer le son 🔈
    </label-->

    
    <ActionButton
      :onClick="() => emit('logout')"
      style="display: block; margin: 10px auto;"
    >
      🚪 Déconnexion
    </ActionButton>
  </Popup>
</template>

<script setup>
import { useSettings } from '@/composables/useSettings'
import Popup from '@/components/menu/Popup.vue'
import ActionButton from '@/components/menu/ActionButton.vue'

defineProps({
    visible: Boolean
})

const { settings } = useSettings()

const emit = defineEmits(['close','logout'])

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
</style>