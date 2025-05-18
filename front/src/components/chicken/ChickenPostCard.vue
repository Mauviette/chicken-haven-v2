<template>
    <div class="post-card">
      <img :src="image" alt="poule" class="poule-img" />
  
      <div class="info">
        <div class="name">{{ espece.nom }}</div>
        <div class="talent">✨ {{ espece.talent }} {{ toRoman(poule.niveauTalent) }}</div>
        <div class="stat">
          {{ statIcon }} {{ statLabel }} :
          <strong>{{ espece.stats[posteStat] || 0 }}</strong>
        </div>
      </div>
  
      <button class="assign-btn" @click="$emit('assigner', poule)">
        Assigner
      </button>
    </div>
  </template>
  
  <script setup>
  defineProps({
    poule: Object,
    espece: Object,
    image: String,
    posteStat: {
      type: String,
      default: 'charisme'
    }
  })
  
  function toRoman(n) {
    const r = ['','I','II','III','IV','V']
    return r[n] || n
  }
  
  const statIcon = '✨'
  const statLabel = 'Charisme'
  </script>
  
  <style scoped>
  .post-card {
    display: flex;
    align-items: center;
    gap: 12px;
    border: 2px solid #ffc66e;
    border-radius: 12px;
    padding: 10px;
    background: #fffaf1;
    font-family: 'Fredoka', sans-serif;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .poule-img {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    border: 2px solid #ffd58f;
    background: white;
    object-fit: cover;
  }
  
  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    color: #5c2c08;
  }
  
  .name {
    font-weight: bold;
    font-size: 16px;
  }
  
  .talent {
    font-size: 13px;
    color: #b2773c;
  }
  
  .stat {
    font-size: 13px;
  }
  
  .assign-btn {
    background-color: #7a3e10;
    border: 2px solid #ffc66e;
    color: #fff9e5;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 13px;
      cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
    transition: background-color 0.1s ease;
  }
  
  .assign-btn:hover {
    background-color: #8a4a1c;
  }
  </style>
  