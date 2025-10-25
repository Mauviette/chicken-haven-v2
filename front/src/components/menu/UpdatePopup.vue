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
import { defineProps } from 'vue'
import { useRouter } from 'vue-router'
import Popup from '@/components/menu/Popup.vue'

const props = defineProps({
  announcement: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}

const viewFullAnnouncement = () => {
  router.push(`/announcements/${props.announcement.slug}`)
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
  // Les images seront servies depuis le backend ou un CDN
  return `/api/announcements/images/${imageName}`
}
</script>

<style scoped>
.update-popup {
  max-width: 500px;
  text-align: center;
}

.update-title {
  color: var(--text-primary);
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
  color: var(--text-secondary);
}

.update-date, .update-version {
  background: var(--bg-secondary);
  padding: 4px 12px;
  border-radius: 12px;
}

.update-image {
  margin: 20px 0;
}

.update-image img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: var(--shadow-primary);
}

.update-summary {
  margin: 20px 0;
  text-align: left;
  line-height: 1.6;
}

.update-summary p {
  margin: 0;
  color: var(--text-primary);
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
}

.action-button.primary {
  background: var(--button-bg);
  color: var(--button-text);
}

.action-button.primary:hover {
  background: var(--button-hover);
  transform: translateY(-1px);
}

.action-button.secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-primary);
}

.action-button.secondary:hover {
  background: var(--bg-tertiary);
}
</style>