<template>
  <div class="social-view">
    <div class="header-bar">
      <h2 class="section-title">👥 Social</h2>
    </div>

    <div class="loading-container" v-if="loading">
      <div class="loading-message">Chargement des classements...</div>
    </div>

    <div class="main-container" v-else-if="leaderboards">
      <!-- Colonne de gauche : Classements -->
      <div class="leaderboards-column">
        <div class="unified-leaderboard-section">
          <div class="leaderboard-header">
            <h3 class="leaderboard-title">🏆 Classements</h3>
          </div>
          
          <!-- Classement Œufs Totaux -->
          <div class="individual-leaderboard">
            <div class="leaderboard-subheader">
              <h4 class="leaderboard-subtitle">🥚 Total d'Œufs Récoltés</h4>
              <div class="user-rank" v-if="userRankings?.totalEggs?.rank">
                Votre rang: <strong>#{{ userRankings.totalEggs.rank }}</strong> / {{ userRankings.totalEggs.total }}
                <span class="user-value">({{ formatNumber(userRankings.totalEggs.value) }} œufs)</span>
              </div>
            </div>
            <div class="leaderboard-list">
              <div 
                v-for="leaderboardPlayer in limitedTotalEggs" 
                :key="`total-${leaderboardPlayer.profileId}`"
                class="leaderboard-item"
                :class="{ 'current-user': isCurrentUser(leaderboardPlayer) }"
                @click="viewPlayer(leaderboardPlayer)"
              >
                <div class="rank-badge" :class="getRankClass(leaderboardPlayer.rank)">
                  {{ leaderboardPlayer.rank }}
                </div>
                <div class="player-avatar">
                  <img 
                    :src="getPlayerAvatar(leaderboardPlayer)" 
                    :alt="leaderboardPlayer.username"
                    class="avatar-img"
                  />
                  <span class="level-badge">{{ leaderboardPlayer.level }}</span>
                </div>
                <div class="player-info">
                  <div class="player-name">
                    {{ leaderboardPlayer.displayName || leaderboardPlayer.username }}
                    <span v-if="leaderboardPlayer.apocalypse" class="apocalypse-badge-small" title="Mode APOCALYPSE">🔥</span>
                  </div>
                  <div class="player-username">{{ leaderboardPlayer.username }}</div>
                  <div class="last-seen">{{ formatLastSeen(leaderboardPlayer.lastSeen) }}</div>
                </div>
                <div class="player-value">
                  {{ formatNumber(leaderboardPlayer.value) }} 🥚
                </div>
              </div>
              <button 
                v-if="leaderboards?.totalEggs && leaderboards.totalEggs.length > 10"
                class="show-more-button"
                @click="openFullLeaderboard('totalEggs')"
              >
                Plus...
              </button>
            </div>
          </div>

          <!-- Classement Max en Un Clic -->
          <div class="individual-leaderboard">
            <div class="leaderboard-subheader">
              <h4 class="leaderboard-subtitle">⚡ Maximum en Un Clic</h4>
              <div class="user-rank" v-if="userRankings?.maxEggs?.rank">
                Votre rang: <strong>#{{ userRankings.maxEggs.rank }}</strong> / {{ userRankings.maxEggs.total }}
                <span class="user-value">({{ formatNumber(userRankings.maxEggs.value) }} œufs)</span>
              </div>
            </div>
            <div class="leaderboard-list">
              <div 
                v-for="leaderboardPlayer in limitedMaxEggs" 
                :key="`max-${leaderboardPlayer.profileId}`"
                class="leaderboard-item"
                :class="{ 'current-user': isCurrentUser(leaderboardPlayer) }"
                @click="viewPlayer(leaderboardPlayer)"
              >
                <div class="rank-badge" :class="getRankClass(leaderboardPlayer.rank)">
                  {{ leaderboardPlayer.rank }}
                </div>
                <div class="player-avatar">
                  <img 
                    :src="getPlayerAvatar(leaderboardPlayer)" 
                    :alt="leaderboardPlayer.username"
                    class="avatar-img"
                  />
                  <span class="level-badge">{{ leaderboardPlayer.level }}</span>
                </div>
                <div class="player-info">
                  <div class="player-name">
                    {{ leaderboardPlayer.displayName || leaderboardPlayer.username }}
                    <span v-if="leaderboardPlayer.apocalypse" class="apocalypse-badge-small" title="Mode APOCALYPSE">🔥</span>
                  </div>
                  <div class="player-username">{{ leaderboardPlayer.username }}</div>
                  <div class="last-seen">{{ formatLastSeen(leaderboardPlayer.lastSeen) }}</div>
                </div>
                <div class="player-value">
                  {{ formatNumber(leaderboardPlayer.value) }} ⚡
                </div>
              </div>
              <button 
                v-if="leaderboards?.maxEggs && leaderboards.maxEggs.length > 10"
                class="show-more-button"
                @click="openFullLeaderboard('maxEggs')"
              >
                Plus...
              </button>
            </div>
          </div>

          <!-- Classement Poules Découvertes -->
          <div class="individual-leaderboard">
            <div class="leaderboard-subheader">
              <h4 class="leaderboard-subtitle">🏆 Succès Obtenus</h4>
              <div class="user-rank" v-if="userRankings?.chickens?.rank">
                Votre rang: <strong>#{{ userRankings.chickens.rank }}</strong> / {{ userRankings.chickens.total }}
                <span class="user-value">({{ userRankings.chickens.value }} succès)</span>
              </div>
            </div>
            <div class="leaderboard-list">
              <div 
                v-for="leaderboardPlayer in limitedChickens" 
                :key="`chickens-${leaderboardPlayer.profileId}`"
                class="leaderboard-item"
                :class="{ 'current-user': isCurrentUser(leaderboardPlayer) }"
                @click="viewPlayer(leaderboardPlayer)"
              >
                <div class="rank-badge" :class="getRankClass(leaderboardPlayer.rank)">
                  {{ leaderboardPlayer.rank }}
                </div>
                <div class="player-avatar">
                  <img 
                    :src="getPlayerAvatar(leaderboardPlayer)" 
                    :alt="leaderboardPlayer.username"
                    class="avatar-img"
                  />
                  <span class="level-badge">{{ leaderboardPlayer.level }}</span>
                </div>
                <div class="player-info">
                  <div class="player-name">
                    {{ leaderboardPlayer.displayName || leaderboardPlayer.username }}
                    <span v-if="leaderboardPlayer.apocalypse" class="apocalypse-badge-small" title="Mode APOCALYPSE">🔥</span>
                  </div>
                  <div class="player-username">{{ leaderboardPlayer.username }}</div>
                  <div class="last-seen">{{ formatLastSeen(leaderboardPlayer.lastSeen) }}</div>
                </div>
                <div class="player-value">
                  {{ leaderboardPlayer.value }} 🏆
                </div>
              </div>
              <button 
                v-if="leaderboards?.chickens && leaderboards.chickens.length > 10"
                class="show-more-button"
                @click="openFullLeaderboard('chickens')"
              >
                Plus...
              </button>
            </div>
          </div>
        </div>
        
        <!-- Banderole d'informations -->
        <div class="footer-info" v-if="meta">
          <div class="meta-info">
            {{ meta.totalPlayers }} joueurs • Mis à jour: {{ formatDate(meta.lastUpdated) }}
          </div>
        </div>
      </div>

      <!-- Colonne de droite : Annonces -->
      <div class="sidebar-column">
        <div class="announcements-section">
          <div class="announcements-header">
            <h3 class="section-title">Annonces</h3>
            <button class="view-all-button" @click="goToAnnouncements">
              Voir tout →
            </button>
          </div>

          <div v-if="announcementsLoading" class="announcements-loading">
            <div class="loading-text">Chargement...</div>
          </div>

          <div v-else-if="announcementsError" class="announcements-error">
            <div class="error-text">{{ announcementsError }}</div>
          </div>

          <div v-else-if="announcements.length > 0" class="announcements-preview">
            <div
              v-for="announcement in announcements"
              :key="announcement.slug"
              class="announcement-preview-item"
              @click="viewAnnouncement(announcement.slug)"
            >
              <div class="announcement-preview-image" v-if="announcement.image">
                <img :src="getAnnouncementImageUrl(announcement.image)" :alt="announcement.title" />
              </div>
              <div class="announcement-preview-content">
                <h4 class="announcement-preview-title">{{ announcement.title }}</h4>
                <p class="announcement-preview-summary">{{ announcement.summary }}</p>
                <div class="announcement-preview-meta">
                  <span class="announcement-preview-date">{{ formatAnnouncementDate(announcement.date) }}</span>
                  <span class="announcement-preview-version">v{{ announcement.version }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="no-announcements">
            <div class="no-announcements-text">Aucune annonce disponible</div>
          </div>
        </div>
      </div>
    </div>

    <div class="error-container" v-else-if="error">
      <div class="error-message">
        ❌ {{ error }}
      </div>
      <button @click="refreshLeaderboards" class="retry-button">
        Réessayer
      </button>
    </div>

    <!-- Popup pour la leaderboard complète -->
    <Popup v-if="showFullLeaderboard" @close="closeFullLeaderboard">
      <div class="full-leaderboard-popup">
        <h3 class="popup-title">{{ getLeaderboardTitle(showFullLeaderboard) }}</h3>
        <div class="user-rank-popup" v-if="userRankings && userRankings[showFullLeaderboard]?.rank">
          Votre rang: <strong>#{{ userRankings[showFullLeaderboard].rank }}</strong> / {{ userRankings[showFullLeaderboard].total }}
          <span class="user-value-popup">({{ formatNumber(userRankings[showFullLeaderboard].value) }} {{ getLeaderboardIcon(showFullLeaderboard) }})</span>
        </div>
        <div class="full-leaderboard-list">
          <div 
            v-for="leaderboardPlayer in leaderboards[showFullLeaderboard]" 
            :key="`full-${showFullLeaderboard}-${leaderboardPlayer.profileId}`"
            class="leaderboard-item"
            :class="{ 'current-user': isCurrentUser(leaderboardPlayer) }"
            @click="viewPlayer(leaderboardPlayer)"
          >
            <div class="rank-badge" :class="getRankClass(leaderboardPlayer.rank)">
              {{ leaderboardPlayer.rank }}
            </div>
            <div class="player-avatar">
              <img 
                :src="getPlayerAvatar(leaderboardPlayer)" 
                :alt="leaderboardPlayer.username"
                class="avatar-img"
              />
              <span class="level-badge">{{ leaderboardPlayer.level }}</span>
            </div>
            <div class="player-info">
              <div class="player-name">
                {{ leaderboardPlayer.displayName || leaderboardPlayer.username }}
                <span v-if="leaderboardPlayer.apocalypse" class="apocalypse-badge-small" title="Mode APOCALYPSE">🔥</span>
              </div>
              <div class="player-username">{{ leaderboardPlayer.username }}</div>
              <div class="last-seen">{{ formatLastSeen(leaderboardPlayer.lastSeen) }}</div>
            </div>
            <div class="player-value">
              {{ showFullLeaderboard === 'chickens' ? leaderboardPlayer.value : formatNumber(leaderboardPlayer.value) }} {{ getLeaderboardIcon(showFullLeaderboard) }}
            </div>
          </div>
        </div>
      </div>
    </Popup>

  </div>
</template>

<script setup>
import { onMounted, computed, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useSocial } from '@/composables/useSocial'
import { usePlayer } from '@/composables/usePlayer'
import { usePoules } from '@/composables/usePoules'
import Popup from '@/components/menu/Popup.vue'
import { useSound } from '@/composables/useSound'
import { apiGet } from '@/utils/api'
import { getApiBaseUrl } from '@/utils/api'
import { formatNumber } from '@/utils/format.js'

const { 
  leaderboards, 
  userRankings, 
  meta, 
  loading, 
  error, 
  fetchLeaderboards 
} = useSocial()

const { player } = usePlayer()
const { getImage: getChickenImage, hiddenImage } = usePoules()
const router = useRouter()
const { profileClick } = useSound()

// État pour les popups
const showFullLeaderboard = ref(null) // null, 'totalEggs', 'maxEggs', 'chickens'

// État pour les annonces
const announcements = ref([])
const announcementsLoading = ref(false)
const announcementsError = ref(null)

onMounted(async () => {
  await fetchLeaderboards()
  await loadAnnouncements()
  
  // Gérer les erreurs d'images après le rendu
  nextTick(() => {
    const images = document.querySelectorAll('.announcement-preview-image img')
    images.forEach(img => {
      img.addEventListener('error', function() {
        console.log('❌ Erreur de chargement d\'image (social), retry:', this.src)
        // Retry avec un timestamp pour éviter le cache
        setTimeout(() => {
          this.src = this.src.split('?')[0] + '?t=' + Date.now()
        }, 1000)
      })
      img.addEventListener('load', function() {
        //console.log('✅ Image chargée (social):', this.src)
      })
    })
  })
})

const refreshLeaderboards = async () => {
  await fetchLeaderboards()
}

const isCurrentUser = (leaderboardPlayer) => {
  if (!player || !player.value || !leaderboardPlayer) return false
  return leaderboardPlayer.profileId === player.value.profileId
}

const getRankClass = (rank) => {
  if (rank === 1) return 'rank-gold'
  if (rank === 2) return 'rank-silver'
  if (rank === 3) return 'rank-bronze'
  if (rank <= 10) return 'rank-top10'
  return 'rank-normal'
}

const formatLastSeen = (date) => {
  if (!date) return 'Jamais vu'
  
  const now = new Date()
  const lastSeen = new Date(date)
  const diffMs = now - lastSeen
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMinutes < 5) return 'En ligne'
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return lastSeen.toLocaleDateString()
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

const getPlayerAvatar = (leaderboardPlayer) => {
  if (!leaderboardPlayer.avatar || leaderboardPlayer.avatar === 'hidden') {
    return hiddenImage
  }
  return getChickenImage(leaderboardPlayer.avatar)
}

const viewPlayer = (leaderboardPlayer) => {
  if (leaderboardPlayer.profileId) {
    profileClick()
    router.push(`/user/${leaderboardPlayer.profileId}`)
  }
}

// Fonctions pour les popups
const openFullLeaderboard = (type) => {
  showFullLeaderboard.value = type
}

const closeFullLeaderboard = () => {
  showFullLeaderboard.value = null
}

// Computed pour limiter les leaderboards à 10 éléments
const limitedTotalEggs = computed(() => leaderboards.value?.totalEggs?.slice(0, 10) || [])
const limitedMaxEggs = computed(() => leaderboards.value?.maxEggs?.slice(0, 10) || [])
const limitedChickens = computed(() => leaderboards.value?.chickens?.slice(0, 10) || [])

// Fonctions pour obtenir le titre du popup
const getLeaderboardTitle = (type) => {
  switch (type) {
    case 'totalEggs': return '🥚 Total d\'Œufs Récoltés'
    case 'maxEggs': return '⚡ Maximum en Un Clic'
    case 'chickens': return '🏆 Succès Obtenus'
    default: return 'Classement'
  }
}

const getLeaderboardIcon = (type) => {
  switch (type) {
    case 'totalEggs': return '🥚'
    case 'maxEggs': return '⚡'
    case 'chickens': return '🏆'
    default: return ''
  }
}

const goToAnnouncements = () => {
  profileClick()
  window.open('/announcements', '_blank')
}

// Fonctions pour les annonces
const loadAnnouncements = async () => {
  try {
    announcementsLoading.value = true
    announcementsError.value = null
    const data = await apiGet('/api/announcements')
    announcements.value = data.slice(0, 3) // Limiter à 3 dernières annonces
  } catch (err) {
    console.error('Erreur lors du chargement des annonces:', err)
    announcementsError.value = 'Impossible de charger les annonces.'
  } finally {
    announcementsLoading.value = false
  }
}

const viewAnnouncement = (slug) => {
  profileClick()
  window.open(`/announcements/${slug}`, '_blank')
}

const formatAnnouncementDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    month: 'short',
    day: 'numeric'
  })
}

const getAnnouncementImageUrl = (imageName) => {
  const url = `${getApiBaseUrl()}/api/announcements/images/${imageName}`
  //console.log('🔗 Image URL générée (social):', url)
  return url
}
</script>

<style scoped>
.social-view {
  padding: 24px;
  background: #f9f3e8;
  font-family: 'Fredoka', sans-serif;
  flex: 1;
  width: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  position: relative;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title {
  font-size: 24px;
  color: #6d3c00;
  margin: 0;
}

.refresh-button .action-button {
  background: #8B4513;
  color: white;
  border: 2px solid #ffc66e;
  border-radius: 8px;
  padding: 8px 16px;
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: all 0.2s ease;
}

.refresh-button .action-button:hover:not(:disabled) {
  background: #A0522D;
  transform: translateY(-1px);
}

.refresh-button .action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-container, .error-container {
  text-align: center;
  padding: 60px 20px;
}

.loading-message {
  font-size: 18px;
  color: #8B4513;
}

.error-message {
  font-size: 16px;
  color: #d32f2f;
  margin-bottom: 16px;
}

.retry-button {
  background: #d32f2f;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-family: 'Fredoka', sans-serif;  
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
}

.leaderboards-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.unified-leaderboard-section {
  background: #fffaf1;
  border: 2px solid #ffc66e;
  border-radius: 12px;
  padding: 16px;
  display: grid;
  gap: 24px;
}

.individual-leaderboard {
  display: grid;
  gap: 16px;
}

.individual-leaderboard + .individual-leaderboard {
  border-top: 1px dashed #ffd99a;
  padding-top: 24px;
}

.leaderboard-subheader {
  margin-bottom: 12px;
  text-align: center;
}

.leaderboard-subtitle {
  font-size: 18px;
  color: #6d3c00;
  margin: 0 0 8px 0;
}

.main-container {
  display: flex;
  gap: 24px;
}

.leaderboards-column {
  flex: 1;
}

.sidebar-column {
  flex: 1;
  display: flex;
  align-items: flex-start;
}

.coming-soon-section {
  background: #fffaf1;
  border: 2px solid #ffc66e;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  text-align: center;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.announcements-section {
  background: #fffaf1;
  border: 2px solid #ffc66e;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.announcements-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 18px;
  color: #6d3c00;
  margin: 0;
}

.view-all-button {
  background: var(--button-bg);
  color: var(--button-text);
  border: 2px solid var(--border-primary);
  border-radius: 6px;
  padding: 4px 8px;
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: all 0.2s ease;
}

.view-all-button:hover {
  background: var(--button-hover);
  transform: translateY(-1px);
}

.announcements-loading, .announcements-error, .no-announcements {
  text-align: center;
  padding: 20px;
}

.loading-text, .error-text, .no-announcements-text {
  font-size: 14px;
  color: #8B4513;
}

.announcements-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.announcement-preview-item {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #ffd99a;
  border-radius: 8px;
  padding: 12px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: all 0.2s ease;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.announcement-preview-item:hover {
  background: rgba(255, 215, 0, 0.05);
  border-color: #d4af37;
  transform: translateY(-1px);
}

.announcement-preview-image {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  border-radius: 6px;
  overflow: hidden;
}

.announcement-preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.announcement-preview-content {
  flex: 1;
  min-width: 0;
}

.announcement-preview-title {
  font-size: 14px;
  color: #4b2e06;
  margin: 0 0 4px 0;
  font-weight: bold;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
}

.announcement-preview-summary {
  font-size: 12px;
  color: #666;
  margin: 0 0 6px 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
}

.announcement-preview-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #8B4513;
}

.announcement-preview-date, .announcement-preview-version {
  background: rgba(255, 215, 0, 0.1);
  padding: 2px 6px;
  border-radius: 8px;
}

.leaderboard-header {
  margin-bottom: 20px;
  text-align: center;
}

.leaderboard-title {
  font-size: 20px;
  color: #6d3c00;
  margin: 0 0 8px 0;
}

.user-rank {
  font-size: 14px;
  color: #8B4513;
  background: rgba(255, 215, 0, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  display: inline-block;
}

.user-value {
  font-weight: normal;
  color: #666;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px dashed #ffd99a;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
}

.leaderboard-item + .leaderboard-item {
  border-top: 1px dashed #ffd99a;
}

.leaderboard-item:hover {
  background: rgba(255, 215, 0, 0.1);
  border-color: #d4af37;
  transform: translateY(-1px);
}

.leaderboard-item.current-user {
  background: rgba(76, 175, 80, 0.1);
  border-color: #4CAF50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
}

.rank-badge {
  min-width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  margin-right: 16px;
}

.rank-gold {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #8B4513;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
}

.rank-silver {
  background: linear-gradient(135deg, #C0C0C0, #A9A9A9);
  color: #333;
  box-shadow: 0 2px 8px rgba(192, 192, 192, 0.4);
}

.rank-bronze {
  background: linear-gradient(135deg, #CD7F32, #A0522D);
  color: white;
  box-shadow: 0 2px 8px rgba(205, 127, 50, 0.4);
}

.rank-top10 {
  background: linear-gradient(135deg, #9C27B0, #673AB7);
  color: white;
}

.rank-normal {
  background: linear-gradient(135deg, #607D8B, #455A64);
  color: white;
}

.player-avatar {
  width: 48px;
  height: 48px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.level-badge {
  position: absolute;
  right: -4px;
  bottom: 2px;
  background: #7b61ff;
  color: white;
  font-weight: bold;
  border: 2px solid #fff;
  font-size: 12px;
  line-height: 1;
  padding: 3px 7px;
  border-radius: 999px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.avatar-img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  image-rendering: pixelated;
}

.default-avatar {
  font-size: 24px;
  background: #e0e0e0;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.player-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-username {
  font-size: 12px;
  color: #888;
  font-family: monospace;
  margin-bottom: 2px;
}

.last-seen {
  font-size: 11px;
  color: #999;
}

.player-value {
  font-size: 16px;
  font-weight: bold;
  color: #6d3c00;
  text-align: right;
  min-width: 80px;
}

.footer-info {
  margin-top: 16px;
  text-align: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px dashed #ffd99a;
  border-radius: 8px;
  margin-bottom: 30px;
}

.meta-info {
  font-size: 12px;
  color: #666;
}

/* Responsive Design */

/* Large tablets and small desktops */
@media (max-width: 1200px) {
  .main-container {
    gap: 20px;
  }
  
  .unified-leaderboard-section {
    padding: 14px;
  }
  
  .leaderboard-title {
    font-size: 18px;
  }
}

/* Tablets */
@media (max-width: 1024px) {
  .main-container {
    flex-direction: column;
    gap: 20px;
  }
  
  .sidebar-column {
    width: 100%;
    order: 1;
  }
  
  .leaderboards-column {
    max-height: none;
    overflow-y: visible;
  }
  
  .announcements-section {
    padding: 16px;
  }
  
  .announcements-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .section-title {
    font-size: 16px;
  }
  
  .view-all-button {
    font-size: 11px;
    padding: 3px 6px;
  }
  
  .announcement-preview-item {
    padding: 10px;
    gap: 10px;
  }
  
  .announcement-preview-image {
    width: 45px;
    height: 45px;
  }
  
  .announcement-preview-title {
    font-size: 13px;
  }
  
  .announcement-preview-summary {
    font-size: 11px;
    margin: 0 0 4px 0;
  }
  
  .announcement-preview-meta {
    font-size: 10px;
  }
}

/* Small tablets and large phones */
@media (max-width: 768px) {
  .social-view {
    padding: 16px;
  }
  
  .header-bar {
    flex-direction: column;
    gap: 12px;
    text-align: center;
    margin-bottom: 20px;
  }
  
  .section-title {
    font-size: 20px;
  }
  
  .main-container {
    gap: 16px;
  }
  
  .unified-leaderboard-section {
    padding: 12px;
    gap: 20px;
  }
  
  .individual-leaderboard + .individual-leaderboard {
    padding-top: 16px;
  }
  
  .leaderboard-title {
    font-size: 16px;
  }
  
  .leaderboard-subtitle {
    font-size: 16px;
  }
  
  .user-rank {
    font-size: 13px;
    padding: 6px 10px;
    margin-top: 8px;
  }
  
  .leaderboard-item {
    padding: 10px 12px;
    border-radius: 6px;
  }
  
  .rank-badge {
    min-width: 32px;
    height: 32px;
    font-size: 14px;
    margin-right: 12px;
  }
  
  .player-avatar {
    width: 40px;
    height: 40px;
    margin-right: 12px;
  }
  
  .avatar-img, .default-avatar {
    width: 40px;
    height: 40px;
    border-radius: 6px;
  }
  
  .level-badge {
    font-size: 11px;
    padding: 2px 6px;
  }
  
  .player-name {
    font-size: 14px;
    margin-bottom: 3px;
  }
  
  .player-username {
    font-size: 11px;
    margin-bottom: 3px;
  }
  
  .last-seen {
    font-size: 10px;
  }
  
  .player-value {
    font-size: 14px;
    min-width: 60px;
  }
  
  .footer-info {
    margin-top: 24px;
    padding: 12px;
  }
  
  .meta-info {
    font-size: 11px;
  }
}

/* Mobile phones */
@media (max-width: 480px) {
  .social-view {
    padding: 12px;
    padding-bottom: 100px;
  }
  
  .header-bar {
    margin-bottom: 16px;
  }
  
  .section-title {
    font-size: 18px;
  }
  
  .main-container {
    gap: 12px;
  }
  
  .unified-leaderboard-section {
    padding: 10px;
    gap: 16px;
  }
  
  .individual-leaderboard + .individual-leaderboard {
    padding-top: 12px;
  }
  
  .leaderboard-title {
    font-size: 14px;
  }
  
  .leaderboard-subtitle {
    font-size: 14px;
  }
  
  .user-rank {
    font-size: 12px;
    padding: 5px 8px;
    border-radius: 6px;
  }
  
  .leaderboard-item {
    padding: 8px 10px;
    border-radius: 6px;
  }
  
  .rank-badge {
    min-width: 28px;
    height: 28px;
    font-size: 12px;
    margin-right: 8px;
  }
  
  .player-avatar {
    width: 36px;
    height: 36px;
    margin-right: 8px;
  }
  
  .avatar-img, .default-avatar {
    width: 36px;
    height: 36px;
    border-radius: 5px;
  }
  
  .level-badge {
    font-size: 10px;
    padding: 2px 5px;
  }
  
  .player-info {
    margin-right: 8px;
    min-width: 0;
  }
  
  .player-name {
    font-size: 13px;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .player-username {
    font-size: 10px;
    margin-bottom: 2px;
  }
  
  .last-seen {
    font-size: 9px;
  }
  
  .player-value {
    font-size: 13px;
    min-width: 50px;
    text-align: right;
  }
  
  .announcements-section {
    padding: 12px;
  }
  
  .section-title {
    font-size: 14px;
  }
  
  .view-all-button {
    font-size: 10px;
    padding: 2px 5px;
  }
  
  .announcement-preview-item {
    padding: 8px;
    gap: 8px;
  }
  
  .announcement-preview-image {
    width: 40px;
    height: 40px;
  }
  
  .announcement-preview-title {
    font-size: 12px;
  }
  
  .announcement-preview-summary {
    font-size: 10px;
    margin: 0 0 4px 0;
  }
  
  .announcement-preview-meta {
    font-size: 9px;
  }
}

/* Very small phones */
@media (max-width: 360px) {
  .social-view {
    padding: 8px;
    padding-bottom: 60px;
  }
  
  .unified-leaderboard-section {
    padding: 8px;
  }
  
  .leaderboard-item {
    padding: 6px 8px;
  }
  
  .rank-badge {
    min-width: 24px;
    height: 24px;
    font-size: 11px;
    margin-right: 6px;
  }
  
  .player-avatar {
    width: 32px;
    height: 32px;
    margin-right: 6px;
  }
  
  .avatar-img, .default-avatar {
    width: 32px;
    height: 32px;
  }
  
  .level-badge {
    font-size: 9px;
    padding: 1px 4px;
  }
  
  .player-name {
    font-size: 12px;
    max-width: 100px;
  }
  
  .player-username {
    font-size: 9px;
  }
  
  .last-seen {
    font-size: 8px;
  }
  
  .player-value {
    font-size: 12px;
    min-width: 45px;
  }
  
  .announcements-section {
    padding: 10px;
  }
  
  .section-title {
    font-size: 13px;
  }
  
  .view-all-button {
    font-size: 9px;
    padding: 2px 4px;
  }
  
  .announcement-preview-item {
    padding: 6px;
    gap: 6px;
  }
  
  .announcement-preview-image {
    width: 35px;
    height: 35px;
  }
  
  .announcement-preview-title {
    font-size: 11px;
  }
  
  .announcement-preview-summary {
    font-size: 9px;
    margin: 0 0 3px 0;
  }
  
  .announcement-preview-meta {
    font-size: 8px;
  }
}

/* Styles pour le bouton Plus */
.show-more-button {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  background: linear-gradient(135deg, #8B4513, #A0522D);
  color: #fff9e5;
  border: 2px solid #ffc66e;
  border-radius: 8px;
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  font-weight: bold;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: all 0.2s ease;
}

.show-more-button:hover {
  background: linear-gradient(135deg, #A0522D, #CD853F);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3);
}

/* Styles pour le popup de leaderboard complète */
.full-leaderboard-popup {
  max-height: 70vh;
  overflow-y: auto;
  min-width: 700px;
  max-width: 95vw;
  padding-top: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 198, 110, 0.3) transparent;
}

.full-leaderboard-popup::-webkit-scrollbar {
  width: 6px;
}

.full-leaderboard-popup::-webkit-scrollbar-track {
  background: transparent;
}

.full-leaderboard-popup::-webkit-scrollbar-thumb {
  background: rgba(255, 198, 110, 0.3);
  border-radius: 3px;
}

.full-leaderboard-popup::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 198, 110, 0.5);
}

/* Surcharge des styles du composant Popup pour la leaderboard */
:deep(.popup-content) {
  width: auto;
  min-width: 700px;
  max-width: 95vw;
}

.popup-title {
  font-size: 20px;
  color: #fff9e5;
  margin: 0;
  text-align: center;
  font-weight: bold;
  position: sticky;
  top: 0;
  background: #7a3e10;
  padding: 16px 0;
  border-bottom: 2px solid #ffc66e;
  z-index: 10;
}

.user-rank-popup {
  font-size: 14px;
  color: #ffc66e;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  display: inline-block;
  margin-bottom: 16px;
  font-weight: bold;
  position: relative;
  z-index: 5;
  margin-top: 16px;
}

.user-value-popup {
  font-weight: normal;
  color: #ddd;
}

.full-leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
}

.full-leaderboard-list .leaderboard-item.current-user {
  background: rgba(76, 175, 80, 0.1);
  border-color: #4CAF50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
  border: 2px solid #4CAF50;
  position: relative;
}

.full-leaderboard-list .rank-badge {
  min-width: 36px;
  height: 36px;
  font-size: 14px;
}

.full-leaderboard-list .player-avatar {
  width: 44px;
  height: 44px;
}

.full-leaderboard-list .avatar-img {
  width: 44px;
  height: 44px;
}

.full-leaderboard-list .level-badge {
  font-size: 11px;
  padding: 2px 6px;
}

.full-leaderboard-list .player-name {
  font-size: 15px;
}

.full-leaderboard-list .player-username {
  font-size: 11px;
}

.full-leaderboard-list .last-seen {
  font-size: 10px;
}

.full-leaderboard-list .player-value {
  font-size: 15px;
  min-width: 70px;
}

/* Badge APOCALYPSE dans les leaderboards */
.apocalypse-badge-small {
  display: inline-block;
  margin-left: 4px;
  font-size: 12px;
  animation: flame-flicker-small 1.5s ease-in-out infinite alternate;
  filter: drop-shadow(0 0 2px rgba(255, 100, 0, 0.6));
}

@keyframes flame-flicker-small {
  0% {
    transform: scale(0.9) rotate(-1deg);
    opacity: 0.9;
  }
  50% {
    transform: scale(1) rotate(1deg);
    opacity: 1;
  }
  100% {
    transform: scale(0.9) rotate(-1deg);
    opacity: 0.9;
  }
}
</style>