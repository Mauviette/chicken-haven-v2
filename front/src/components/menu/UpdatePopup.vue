<template>
  <Popup @close="close">
    <div class="update-popup">
      <h2 class="update-title">{{ announcement.title }}</h2>

      <div class="update-meta">
        <span class="update-date">{{ formatDate(announcement.date) }}</span>
        <span class="update-version">Version {{ announcement.version }}</span>
      </div>

      <div class="update-image" v-if="announcement.image">
        <img :src="getImageUrl(announcement.image)" :alt="announcement.title" />
      </div>

      <div class="update-summary">
        <p>{{ announcement.summary }}</p>
      </div>

      <div class="update-actions">
        <button class="action-button primary" @click="viewFullAnnouncement">
          Voir les détails complets
        </button>
        <button class="action-button secondary" @click="close">
          Fermer
        </button>
      </div>
    </div>
  </Popup>
</template>

<script setup>
import { getApiBaseUrl } from '@/utils/api'
import { useRouter } from 'vue-router'
import Popup from '@/components/menu/Popup.vue'
import { nextTick, onMounted } from 'vue'

const props = defineProps({
  announcement: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const emit = defineEmits(['close'])

onMounted(() => {
  // Gérer les erreurs d'images après le rendu
  nextTick(() => {
    const images = document.querySelectorAll('.update-image img')
    images.forEach(img => {
      img.addEventListener('error', function() {
        console.log('❌ Erreur de chargement d\'image (popup), retry:', this.src)
        // Retry avec un timestamp pour éviter le cache
        setTimeout(() => {
          this.src = this.src.split('?')[0] + '?t=' + Date.now()
        }, 1000)
      })
      img.addEventListener('load', function() {
        console.log('✅ Image chargée (popup):', this.src)
      })
    })
  })
})

const close = () => {
  emit('close')
}

const viewFullAnnouncement = () => {
  window.open(`/announcements/${props.announcement.slug}`, '_blank')
  close()
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getImageUrl = (imageName) => {
  // Utiliser la même URL de base que l'API
  const url = `${getApiBaseUrl()}/api/announcements/images/${imageName}`
  //console.log('🔗 Image URL générée (popup):', url)
  return url
}
</script>

<style scoped>
.update-popup {
  max-width: 500px;
  text-align: center;
}

.update-title {
  color: #2c1810;
  font-size: 24px;
  margin-bottom: 16px;
  font-weight: bold;
}

.update-meta {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #6b4423;
}

.update-date, .update-version {
  background: #f6e4c3;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid #d4a574;
}

.update-image {
  margin: 20px 0;
}

.update-image img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.update-summary {
  margin: 20px 0;
  text-align: left;
  line-height: 1.6;
}

.update-summary p {
  margin: 0;
  color: #2c1810;
}

.update-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.action-button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-family: 'Fredoka', sans-serif;
  font-size: 16px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: all 0.2s ease;
  font-weight: 600;
}

.action-button.primary {
  background: linear-gradient(135deg, #8b4513, #a0552a);
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(139, 69, 19, 0.3);
}

.action-button.primary:hover {
  background: linear-gradient(135deg, #a0552a, #b8653a);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(139, 69, 19, 0.4);
}

.action-button.secondary {
  background: #f9f3e8;
  color: #8b4513;
  border: 2px solid #d4a574;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-button.secondary:hover {
  background: #f0e6d2;
  border-color: #b8653a;
  color: #6b4423;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
</style>