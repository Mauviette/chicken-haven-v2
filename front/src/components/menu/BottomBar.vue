<template>
  <div class="bottom-bar">
    <ActionButton
      :onClick="() => emit('open-production')"
      :disabled="route.path === '/production'"
      :active="route.path === '/production'"
    >
      ⚒️ Production
    </ActionButton>

    <ActionButton
      :onClick="() => emit('open-market')"
      :disabled="route.path === '/market'"
      :active="route.path === '/market'"
    >
      🛒 Marché
    </ActionButton>

    <ActionButton
      :onClick="() => emit('open-collection')"
      :disabled="route.path === '/collection'"
      :active="route.path === '/collection'"
    >
      🐔 Collection
    </ActionButton>

    <!--ActionButton
      :onClick="() => emit('open-help')"
    >
      ❓ Aide
    </ActionButton-->

    <ActionButton
      :onClick="() => emit('open-options')"
    >
      ⚙️ Options
    </ActionButton>
  </div>
</template>
<script setup>
import ActionButton from '@/components/menu/ActionButton.vue'
import { useRoute } from 'vue-router'
const route = useRoute()

const emit = defineEmits(['open-production', 'open-market', 'open-collection', 'open-help', 'open-options'])
</script>

  <style scoped>
  .bottom-bar {
    width: 100%;
    height: 80px;
    background-color: #421d00;
    background-image: url('@/assets/bar/bg.png');
    background-repeat: repeat;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 0 20px;
    box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
    position: relative;
    border-top: 4px solid #b77b3d; /* bois clair ou doré */
    box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.25);
    }

  .bottom-bar button {
    background-color: #7a3e10;
    border: 2px solid #ffc66e;
    color: #fff9e5;
    border-radius: 10px;
    padding: 8px 12px;
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;

    transition: transform 0.1s ease;
  }

  .bottom-bar button:hover {
    background-color: #8a4a1c;
    transform: translateY(-1px);
  }

  </style>
