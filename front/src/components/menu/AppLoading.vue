<template>
  <div v-if="isVisible" class="app-loading-overlay">
    <div class="loading-container">
      <div class="loading-icon"></div>
      <div class="loading-text">Chargement de Chicken Haven...</div>
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <div class="loading-details">{{ loadingStatus }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppLoading } from '@/composables/useAppLoading'
import { useAuth } from '@/composables/useAuth'

const { isAppLoading, isLoadingGameData, isLoadingUserData, isLoadingSettings } = useAppLoading()
const { isLoggedIn } = useAuth()

const isVisible = computed(() => isLoggedIn() && isAppLoading.value)

const loadingStatus = computed(() => {
  if (isLoadingGameData.value) return 'Synchronisation des données de jeu...'
  if (isLoadingUserData.value) return 'Chargement de vos données...'
  if (isLoadingSettings.value) return 'Configuration des paramètres...'
  return 'Finalisation...'
})
</script>

<style scoped>
.app-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(254, 247, 224, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
  backdrop-filter: blur(2px);
}

.loading-container {
  text-align: center;
  padding: 40px;
  background: #fff7dc;
  border: 3px solid #ffc66e;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  font-family: 'Fredoka', sans-serif;
  max-width: 320px;
}

.loading-icon {
  font-size: 64px;
  margin-bottom: 20px;
  animation: bounce 1.5s ease-in-out infinite;
}

.loading-text {
  font-size: 20px;
  font-weight: bold;
  color: #6d3c00;
  margin-bottom: 24px;
}

.loading-spinner {
  margin: 20px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 4px solid #ffc66e;
  border-top: 4px solid #6d3c00;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-details {
  font-size: 14px;
  color: #8b6914;
  font-style: italic;
  margin-top: 16px;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .loading-container {
    max-width: 280px;
    padding: 30px 20px;
  }
  
  .loading-icon {
    font-size: 48px;
  }
  
  .loading-text {
    font-size: 18px;
  }
}
</style>