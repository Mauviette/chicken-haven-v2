<template>
    <div class="bottom-bar">
      <button @click="$emit('open-market')">🛒 Marché</button>
      <button @click="$emit('open-collection')">🐔 Collection</button>
      <button v-if="hasHatchery" @click="$emit('open-hatchery')">🐣 Couvoir</button>
      <button @click="$emit('open-options')">⚙️ Options</button>
      <button @click="$emit('open-help')">❓ Aide</button>
      <button class="logout-button" @click="$emit('logout')">🚪 Déconnexion</button>
    </div>
  </template>
  
  <script setup>
  defineProps({
    hasHatchery: Boolean // débloqué ou pas
  })
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
  }
  
  .bottom-bar button {
    background-color: #7a3e10;
    border: 2px solid #ffc66e;
    color: #fff9e5;
    border-radius: 10px;
    padding: 8px 12px;
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.1s ease;
  }
  
  .bottom-bar button:hover {
    background-color: #8a4a1c;
    transform: translateY(-1px);
  }
  </style>
  