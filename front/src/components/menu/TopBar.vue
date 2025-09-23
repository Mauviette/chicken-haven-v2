<template>
  <div class="top-bar">
    <div class="top-bar-inner">
      <div class="game-title">Chicken Haven</div>
      <div class="top-right">
        <div class="egg-counter">
          <span>🥚 {{ eggs }} œufs</span>
        </div>
        <button class="profile-btn" @click="openProfileMenu">
          <img src="@/assets/ui/avatar-default.svg" class="avatar" />
        </button>
      </div>
    </div>
  </div>
</template>


<script setup>
import { usePlayer } from '@/composables/usePlayer'
const { eggs } = usePlayer()

const emit = defineEmits(['open-profile'])

function openProfileMenu() {
  emit('open-profile')
}
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
  overflow: hidden;
}

.top-bar-inner {
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.top-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.egg-counter {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #fff7dc;
  border: 2px solid #ffc66e;
  border-radius: 12px;
  padding: 5px 10px;
  font-size: 15px;
  color: #6d3c00;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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

@media (max-width: 600px) {
  .top-bar-inner {
    padding: 0 10px;
  }

  .game-title {
    font-size: 14px;
  }

  .egg-counter {
    font-size: 13px;
    padding: 4px 6px;
  }

  .avatar {
    width: 26px;
    height: 26px;
  }
}

</style>
