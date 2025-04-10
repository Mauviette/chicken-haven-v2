<template>
  <div class="farm-screen">
    <header class="hud">
      <h1>Chicken Haven 🐔</h1>
      <div class="egg-counter">🥚 {{ eggs }} œufs</div>
    </header>

    <FarmGrid :gridSize="14" @chicken-click="eggs++" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FarmGrid from '@/components/farm/FarmGrid.vue'

const eggs = ref(0)
</script>

<style scoped>
.farm-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  overflow: hidden;
}

.hud {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 800px;
  padding: 10px;
  background: #ffe9b4;
  font-weight: bold;
  font-size: 1.2rem;
}

.egg-counter {
  background: #fff;
  padding: 6px 12px;
  border-radius: 12px;
  box-shadow: 0 0 5px #ccc;
}


</style>
