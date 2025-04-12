<template>
    <div class="top-bar">
      <div class="top-bar-inner">
        <div class="game-title">🐔 Chicken Haven</div>
        <div class="top-right">
          <div class="egg-counter">
            <span>🥚 {{ eggs }} œufs</span>
          </div>
          <button class="profile-btn" @click="$emit('open-profile')">
            <img src="@/assets/ui/avatar-default.svg" class="avatar" />
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    eggs: Number
  })
  </script>
  
  <style scoped>
  .top-bar {
    width: 100%;
    height: 60px;
    background-color: #f6e4c3;
    background-image: url("@/assets/bar/top-texture.png");
    background-repeat: repeat;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Fredoka', sans-serif;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  }
  
  .top-bar-inner {
    width: 100%;
    max-width: 100%;
    padding: 0 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .top-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .egg-counter {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #fff7dc;
    border: 2px solid #ffc66e;
    border-radius: 12px;
    padding: 6px 10px;
    font-size: 15px;
    color: #6d3c00;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .egg-icon {
    width: 20px;
    height: 20px;
  }
  
  .profile-btn {
    background: none;
    border: none;
    
    padding: 0;
  }
  
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid #ffc66e;
    background-color: white;
  }
  </style>
  