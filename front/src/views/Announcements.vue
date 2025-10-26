<template>
  <div class="announcements-view">
    <div class="header-bar">
      <h1 class="page-title">Annonces</h1>
    </div>

    <div class="announcements-content">
      <div v-if="loading" class="loading-container">
        <div class="loading-message">Chargement des annonces...</div>
      </div>

      <div v-else-if="error" class="error-container">
        <div class="error-message">{{ error }}</div>
        <button class="retry-button" @click="loadAnnouncements">Réessayer</button>
      </div>

      <div v-else class="announcements-list">
        <div
          v-for="announcement in announcements"
          :key="announcement.slug"
          class="announcement-card"
          @click="viewAnnouncement(announcement.slug)"
        >
          <div class="announcement-image" v-if="announcement.image">
            <img :src="getImageUrl(announcement.image)" :alt="announcement.title" />
          </div>

          <div class="announcement-content">
            <h3 class="announcement-title">{{ announcement.title }}</h3>
            <div class="announcement-meta">
              <span class="announcement-date">{{ formatDate(announcement.date) }}</span>
              <span class="announcement-version">v{{ announcement.version }}</span>
            </div>
            <p class="announcement-summary">{{ announcement.summary }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet } from '@/utils/api'
import { getApiBaseUrl } from '@/utils/api'
import { useSound } from '@/composables/useSound'

const router = useRouter()
const { click } = useSound()

const announcements = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(() => {
  loadAnnouncements()
  
  // Gérer les erreurs d'images après le rendu
  nextTick(() => {
    const images = document.querySelectorAll('.announcement-image img')
    images.forEach(img => {
      img.addEventListener('error', function() {
        console.log('❌ Erreur de chargement d\'image (liste), retry:', this.src)
        // Retry avec un timestamp pour éviter le cache
        setTimeout(() => {
          this.src = this.src.split('?')[0] + '?t=' + Date.now()
        }, 1000)
      })
      img.addEventListener('load', function() {
        console.log('✅ Image chargée (liste):', this.src)
      })
    })
  })
})

const loadAnnouncements = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await apiGet('/api/announcements')
    announcements.value = data
  } catch (err) {
    console.error('Erreur lors du chargement des annonces:', err)
    error.value = 'Impossible de charger les annonces. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}

const viewAnnouncement = (slug) => {
  click()
  router.push(`/announcements/${slug}`)
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
  //console.log('🔗 Image URL générée (liste):', url)
  return url
}
</script>

<style scoped>
.announcements-view {
  padding: 24px;
  background: var(--bg-primary);
  font-family: 'Fredoka', sans-serif;
  height: 100vh;
  overflow-y: auto;
}

.header-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  color: var(--text-header);
  margin: 0;
  flex: 1;
}

.announcements-content {
  max-width: 800px;
  margin: 0 auto;
}

.loading-container, .error-container {
  text-align: center;
  padding: 60px 20px;
}

.loading-message {
  font-size: 18px;
  color: var(--text-primary);
}

.error-message {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.retry-button {
  background: var(--button-bg);
  color: var(--button-text);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-family: 'Fredoka', sans-serif;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: var(--button-hover);
  transform: translateY(-1px);
}

.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.announcement-card {
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  padding: 20px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: all 0.2s ease;
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.announcement-card:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-secondary);
}

.announcement-image {
  flex-shrink: 0;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
}

.announcement-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.announcement-content {
  flex: 1;
}

.announcement-title {
  font-size: 20px;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  font-weight: bold;
}

.announcement-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.announcement-date, .announcement-version {
  background: var(--bg-primary);
  padding: 4px 8px;
  border-radius: 12px;
}

.announcement-summary {
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .announcements-view {
    padding: 16px;
  }

  .header-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .announcement-card {
    flex-direction: column;
    gap: 16px;
  }

  .announcement-image {
    width: 100%;
    height: 200px;
  }
}

@media (max-width: 480px) {
  .announcements-view {
    padding: 12px;
  }

  .announcement-card {
    padding: 16px;
  }

  .announcement-title {
    font-size: 18px;
  }
}
</style>