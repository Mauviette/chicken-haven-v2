<template>
  <div class="farming-requester">
    <!-- Badge mobile pour ouvrir le personnage -->
    <button 
      v-if="isMobile && hasRequests && !isFullscreen"
      class="requester-badge"
      :class="{ 'has-new': hasUnseen }"
      @click="openFullscreen"
    >
      <img 
        src="@/assets/farming/characters/personnage.png" 
        alt="Demandeur"
        class="badge-image"
      />
      <span v-if="hasUnseen" class="badge-notification">!</span>
    </button>

    <!-- Version desktop : liste des personnages empilés en haut -->
    <div v-if="hasRequests && !isMobile" class="requesters-list">
      <div 
        v-for="(request, index) in activeRequests" 
        :key="request.id"
        class="requester-item"
        :class="{ 'active': currentIndex === index }"
        @click="selectRequest(index)"
      >
        <!-- Le personnage -->
        <div class="character-wrapper-small">
          <img 
            src="@/assets/farming/characters/personnage.png" 
            alt="Demandeur"
            class="character-image-small"
          />
          <!-- Badge notification -->
          <span v-if="!request.seen" class="character-notification-small">!</span>
          <!-- Légumes demandés au-dessus -->
          <div class="request-icons-preview">
            <span 
              v-for="req in request.requirements" 
              :key="req.vegetable"
              class="preview-icon"
            >
              {{ getVegetableIcon(req.vegetable) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulle de dialogue (desktop) -->
    <Transition name="fade">
      <div 
        v-if="hasRequests && !isMobile && showDialogue && currentRequest" 
        class="speech-bubble-desktop"
      >
        <button class="close-bubble" @click="closeDialogue">✕</button>
        
        <!-- Dialogue -->
        <p class="dialogue-text">"{{ currentRequest.dialogue }}"</p>

        <!-- Ce qu'il demande -->
        <div class="requirements">
          <template v-if="currentRequest?.requirements && Array.isArray(currentRequest.requirements)">
            <Tooltip 
              v-for="(req, idx) in currentRequest.requirements" 
              :key="`req-${idx}-${req?.vegetable}`"
              :text="req?.vegetable ? `<strong>${getVegetableName(req.vegetable)}</strong><br>${getVegetableDescription(req.vegetable)}` : 'Légume inconnu'"
            >
              <div 
                class="requirement-item"
                :class="{ 'has-enough': req?.vegetable && hasEnough(req) }"
              >
                <span class="req-icon">{{ req?.vegetable ? getVegetableIcon(req.vegetable) : '🥬' }}</span>
                <span class="req-quantity">
                  {{ req?.vegetable ? getVegetableCount(req.vegetable) : 0 }}/{{ req?.quantity || 0 }}
                </span>
              </div>
            </Tooltip>
          </template>
        </div>

        <!-- Récompenses -->
        <div class="rewards">
          <Tooltip text="<strong>Potathunes</strong><br>Monnaie du potager pour acheter des améliorations">
            <span class="reward-item potathune">💵 {{ currentRequest.rewards?.potathune || 0 }}</span>
          </Tooltip>
          <Tooltip text="<strong>Expérience</strong><br>Gagnez des niveaux pour débloquer plus de fonctionnalités">
            <span class="reward-item xp">⭐ {{ currentRequest.rewards?.xp || 0 }} XP</span>
          </Tooltip>
        </div>

        <!-- Timer unifié -->
        <div v-if="waitMessage" class="timer-info">
          <span class="timer-text">{{ waitMessage }}</span>
        </div>

        <!-- Boutons d'action -->
        <div class="action-buttons">
          <Tooltip text="<strong>Renvoyer</strong><br>Coûte 2 potathunes<br>Il reviendra plus tard avec une nouvelle demande">
            <BuyButton 
              :price="{ _iconOverride: '💵', count: 2 }"
              :onClick="handleDismiss"
              :disabled="loading || !canDismiss"
            >
              Renvoyer
            </BuyButton>
          </Tooltip>
          <button 
            class="btn-complete"
            :disabled="!canComplete || loading"
            @click="handleComplete"
          >
            {{ loading ? '...' : 'Donner' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Animation de récompense (superposée sur la bulle) -->
    <div v-if="showRewardAnimation" class="reward-animation-container" :style="{
      top: animationPosition.top + 'px',
      left: animationPosition.left + 'px'
    }">
      <!-- Effet de confettis/particules -->
      <div 
        v-for="(particle, i) in particlePositions" 
        :key="`particle-${i}`" 
        class="reward-particle"
        :style="particle"
      ></div>
      
      <div class="reward-animation">
        <div v-if="animatedRewards.potathune > 0" class="animated-reward potathune">
          <span class="reward-emoji">💵</span>
          <span class="reward-amount">+{{ animatedRewards.potathune }}</span>
        </div>
        <div v-if="animatedRewards.xp > 0" class="animated-reward xp">
          <span class="reward-emoji">⭐</span>
          <span class="reward-amount">+{{ animatedRewards.xp }} XP</span>
        </div>
      </div>
    </div>

    <!-- Version mobile fullscreen -->
    <Transition name="slide-up">
      <div v-if="isMobile && isFullscreen && currentRequest" class="fullscreen-modal">
        <button class="close-fullscreen" @click="closeFullscreen">✕</button>
        
        <!-- Navigation si plusieurs demandes -->
        <div v-if="requestCount > 1" class="request-nav">
          <button class="nav-btn" :disabled="currentIndex === 0" @click="prevRequest">◀</button>
          <span class="nav-indicator">{{ currentIndex + 1 }}/{{ requestCount }}</span>
          <button class="nav-btn" :disabled="currentIndex >= requestCount - 1" @click="nextRequest">▶</button>
        </div>

        <!-- Personnage -->
        <div class="fullscreen-character">
          <img src="@/assets/farming/characters/personnage.png" alt="Demandeur" class="character-image-large" />
        </div>

        <!-- Dialogue -->
        <p class="dialogue-text-large">"{{ currentRequest.dialogue }}"</p>

        <!-- Ce qu'il demande -->
        <div class="requirements-large">
          <template v-if="currentRequest?.requirements && Array.isArray(currentRequest.requirements)">
            <div 
              v-for="(req, idx) in currentRequest.requirements" 
              :key="`req-large-${idx}-${req?.vegetable}`"
              class="requirement-item-large"
              :class="{ 'has-enough': req?.vegetable && hasEnough(req) }"
            >
              <span class="req-icon-large">{{ req?.vegetable ? getVegetableIcon(req.vegetable) : '🥬' }}</span>
              <span class="req-quantity-large">{{ req?.vegetable ? getVegetableCount(req.vegetable) : 0 }}/{{ req?.quantity || 0 }}</span>
            </div>
          </template>
        </div>

        <!-- Récompenses -->
        <div class="rewards-large">
          <span class="reward-item-large potathune">💵 {{ currentRequest.rewards?.potathune || 0 }}</span>
          <span class="reward-item-large xp">⭐ {{ currentRequest.rewards?.xp || 0 }} XP</span>
        </div>

        <!-- Timer unifié -->
        <div v-if="waitMessage" class="timer-info-large">
          <span>{{ waitMessage }}</span>
        </div>

        <!-- Boutons -->
        <div class="action-buttons-large">
          <Tooltip text="<strong>Renvoyer</strong><br>Coûte 2 potathunes<br>Il reviendra plus tard avec une nouvelle demande">
            <BuyButton 
              :price="{ _iconOverride: '💵', count: 2 }"
              :onClick="handleDismiss"
              :disabled="loading || !canDismiss"
            >
              Renvoyer
            </BuyButton>
          </Tooltip>
          <button class="btn-complete-large" :disabled="!canComplete || loading" @click="handleComplete">
            {{ loading ? '...' : 'Donner' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Popup de confirmation pour renvoyer -->
    <Popup v-if="showDismissConfirm" @close="cancelDismiss">
      <p class="dismiss-text">Renvoyer ce visiteur ?</p>
      <p class="dismiss-warning">Il reviendra plus tard avec une autre demande.</p>
      <div class="dismiss-buttons">
        <button class="btn-cancel" @click="cancelDismiss">Annuler</button>
        <button class="btn-confirm" @click="confirmDismiss">Renvoyer</button>
      </div>
    </Popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useFarming } from '@/composables/useFarming'
import { useSound } from '@/composables/useSound'
import Tooltip from '@/components/menu/Tooltip.vue'
import BuyButton from '@/components/menu/BuyButton.vue'
import Popup from '@/components/menu/Popup.vue'

const emit = defineEmits(['completed'])

const { 
  activeRequests, 
  vegetables, 
  openRequest, 
  completeRequest, 
  dismissRequest,
  fetchState,
  loading,
  potathune
} = useFarming()

const { harvestCollect } = useSound()

// Icônes des légumes (emojis)
const vegetableIcons = {
  potato: '🥔',
  carrot: '🥕',
  corn: '🌽',
  tomato: '🫛',
  lettuce: '🥬',
  pumpkin: '🥦'
}

const vegetableNames = {
  potato: 'Patate',
  carrot: 'Carotte',
  corn: 'Maïs',
  tomato: 'Petits Pois',
  lettuce: 'Laitue',
  pumpkin: 'Brocoli'
}

const vegetableDescriptions = {
  potato: 'Une patate bien ronde qui pousse sous terre.',
  carrot: 'Une belle carotte orange.',
  corn: 'Un délicieux épi de maïs.',
  tomato: 'De délicieux petits pois verts.',
  lettuce: 'Une laitue fraîche et croquante.',
  pumpkin: 'Un brocoli vert et nutritif.'
}

// État local
const showDialogue = ref(false)
const currentIndex = ref(0)
const isFullscreen = ref(false)
const showDismissConfirm = ref(false)
const timeUntilExpire = ref(0)
const showRewardAnimation = ref(false)
const animatedRewards = ref({ potathune: 0, xp: 0 })
const animationPosition = ref({ top: 0, left: 0 })
let timerInterval = null

// Détection mobile
const isMobile = ref(window.innerWidth < 768)

function updateMobile() {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) {
    isFullscreen.value = false
  }
}

// Computed
const hasRequests = computed(() => activeRequests.value.length > 0)
const requestCount = computed(() => activeRequests.value.length)
const hasUnseen = computed(() => activeRequests.value.some(r => !r.seen))

const currentRequest = computed(() => {
  if (!hasRequests.value) return null
  // S'assurer que l'index est valide
  const idx = Math.min(currentIndex.value, requestCount.value - 1)
  return activeRequests.value[idx] || null
})

// Vérifie si on peut compléter (juste les ressources)
const canComplete = computed(() => {
  const req = currentRequest.value
  if (!req || !Array.isArray(req.requirements) || req.requirements.length === 0) return false
  for (const r of req.requirements) {
    if (!r || !r.vegetable) continue // Ignorer les items invalides
    const available = vegetables.value[r.vegetable] || 0
    if (available < r.quantity) return false
  }
  return true
})

// Vérifie si on peut renvoyer (2 potathunes minimum)
const canDismiss = computed(() => {
  return (potathune.value || 0) >= 2
})

// Message pour le timer d'expiration
const waitMessage = computed(() => {
  if (timeUntilExpire.value > 0) {
    // Affiche l'expiration pour tous les visiteurs actifs
    return `⏱️ Part dans ${formatTimeLeft(timeUntilExpire.value)}`
  }
  return null
})

// Générer les positions des particules
const particlePositions = computed(() => {
  const particles = []
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const distance = 200
    const x = Math.cos(angle) * distance
    const y = -Math.sin(angle) * distance - 100
    particles.push({
      '--particle-x': `${x}px`,
      '--particle-y': `${y}px`,
      '--particle-delay': `${i * 0.05}s`
    })
  }
  return particles
})

// Watchers
watch(currentRequest, (req) => {
  if (req) {
    updateTimers()
  }
})

// Méthodes
function getVegetableIcon(type) {
  return vegetableIcons[type] || '🥬'
}

function getVegetableName(type) {
  return vegetableNames[type] || type
}

function getVegetableDescription(type) {
  return vegetableDescriptions[type] || 'Un légume mystérieux'
}

function getVegetableCount(type) {
  // Retourner 0 si vegetables n'est pas défini, au lieu de undefined
  if (!vegetables.value) return 0
  return vegetables.value[type] ?? 0
}

function hasEnough(req) {
  return getVegetableCount(req.vegetable) >= req.quantity
}

function formatTimeLeft(ms) {
  if (ms <= 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function updateTimers() {
  const req = currentRequest.value
  if (!req) {
    timeUntilExpire.value = 0
    return
  }
  
  const now = Date.now()
  
  // Temps avant expiration
  if (req.expiresAt) {
    timeUntilExpire.value = Math.max(0, new Date(req.expiresAt).getTime() - now)
  }
}

// Sélectionner une demande (desktop)
async function selectRequest(index) {
  // Si on clique sur la demande actuelle, fermer la bulle
  if (currentIndex.value === index && showDialogue.value) {
    showDialogue.value = false
    return
  }
  currentIndex.value = index
  
  // Marquer comme vu AVANT d'afficher la bulle
  await markAsSeen()
  
  // Afficher seulement après que markAsSeen soit terminé
  showDialogue.value = true
}

function openFullscreen() {
  isFullscreen.value = true
  // markAsSeen sera appelé après, donc on affiche directement
  showDialogue.value = true
  markAsSeen()
}

function closeFullscreen() {
  isFullscreen.value = false
  showDialogue.value = false
}

async function openDialogue() {
  showDialogue.value = true
  await markAsSeen()
}

function closeDialogue() {
  showDialogue.value = false
}

async function markAsSeen() {
  const req = currentRequest.value
  if (req && !req.seen) {
    try {
      await openRequest(req.id)
      updateTimers()
    } catch (err) {
      console.error('Erreur marquage demande:', err)
    }
  }
}

function prevRequest() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    markAsSeen()
  }
}

function nextRequest() {
  if (currentIndex.value < requestCount.value - 1) {
    currentIndex.value++
    markAsSeen()
  }
}

function handleDismiss() {
  showDismissConfirm.value = true
}

function cancelDismiss() {
  showDismissConfirm.value = false
}

async function confirmDismiss() {
  const req = currentRequest.value
  if (!req) return
  
  try {
    await dismissRequest(req.id)
    showDismissConfirm.value = false
    // Ajuster l'index si nécessaire
    if (currentIndex.value >= requestCount.value && currentIndex.value > 0) {
      currentIndex.value--
    }
    // Fermer le dialogue si plus de demandes
    if (!hasRequests.value) {
      showDialogue.value = false
      isFullscreen.value = false
    }
    
    // Charger le prochain visiteur après 1.5s
    setTimeout(() => {
      try {
        fetchState()
      } catch (err) {
        console.error('Erreur lors du chargement des visiteurs:', err)
      }
    }, 1500)
  } catch (err) {
    const errorMsg = err.response?.data?.error || err.message || 'Erreur lors du renvoi'
    window.toast?.(errorMsg, 'error')
    console.error('Erreur renvoi demande:', err)
  }
}

async function handleComplete() {
  const req = currentRequest.value
  if (!req || !canComplete.value) return
  
  // Capturer la position du visiteur AVANT de le faire disparaître
  let visitorPosition = null
  let rewardPosition = null
  await nextTick()
  
  let pnjElement = null
  if (isMobile.value && isFullscreen.value) {
    // Mode fullscreen mobile
    pnjElement = document.querySelector('.fullscreen-character .character-image-large')
  } else if (isMobile.value) {
    // Mode mobile normal
    pnjElement = document.querySelector('.requester-badge')
  } else {
    // Mode desktop
    pnjElement = document.querySelector('.requester-item.active')
  }
  
  if (pnjElement) {
    const rect = pnjElement.getBoundingClientRect()
    visitorPosition = {
      left: rect.left + rect.width / 2,
      top: rect.top + rect.height / 2
    }
    rewardPosition = {
      top: rect.top + rect.height / 2,
      left: rect.left + rect.width / 2
    }
  }
  
  try {
    const result = await completeRequest(req.id)
    
    // Déclencher l'animation de récompense avec les légumes consommés
    if (result?.rewards) {
      // Jouer un son de récompense
      harvestCollect()
      
      showRewardAnimation.value = true
      animatedRewards.value = {
        potathune: result.rewards.potathune || 0,
        xp: result.rewards.xp || 0
      }
      
      // Calculer la position pour l'animation de récompense
      if (rewardPosition) {
        animationPosition.value = rewardPosition
      }
      
      // Créer les animations pour les légumes consommés
      if (req.requirements && Array.isArray(req.requirements)) {
        req.requirements.forEach((req, idx) => {
          if (req?.vegetable && req?.quantity) {
            setTimeout(() => {
              createVegetableAnimation(req.vegetable, req.quantity, visitorPosition)
            }, idx * 100) // Décalage pour un effet en cascade
          }
        })
      }
      
      // Créer les animations pour les récompenses
      if (result.rewards.potathune > 0) {
        setTimeout(() => {
          createRewardAnimation('potathune', result.rewards.potathune, visitorPosition)
        }, 500)
      }
      // Animation XP supprimée - elle est déjà affichée dans le template
      
      // Charger le prochain visiteur après l'animation (3.5s pour laisser le temps à l'animation de finir)
      setTimeout(() => {
        showRewardAnimation.value = false
        // Charger l'état pour obtenir les nouveaux visiteurs
        try {
          fetchState()
        } catch (err) {
          console.error('Erreur lors du chargement des visiteurs:', err)
        }
      }, 3500)
    }
    
    // Ajuster l'index si nécessaire
    if (currentIndex.value >= requestCount.value && currentIndex.value > 0) {
      currentIndex.value--
    }
    // Fermer si plus de demandes
    if (!hasRequests.value) {
      showDialogue.value = false
      isFullscreen.value = false
    }
    // Émettre un événement pour feedback visuel
    emit('completed', result)
  } catch (err) {
    const errorMsg = err.response?.data?.error || err.message || 'Erreur lors de la complétion'
    window.toast?.(errorMsg, 'error')
    console.error('Erreur complétion demande:', err)
  }
}

// Fonction pour créer les animations des légumes consommés
function createVegetableAnimation(vegetableType, quantity, position = null) {
  const icon = getVegetableIcon(vegetableType)
  const el = document.createElement('div')
  el.textContent = `-${quantity} ${icon}`
  
  // Appliquer les styles inline directement
  el.style.position = 'fixed'
  el.style.fontSize = '20px'
  el.style.fontWeight = 'bold'
  el.style.fontFamily = "'Fredoka', sans-serif"
  el.style.color = '#FF6B6B'
  el.style.textShadow = '0 0 8px rgba(255, 107, 107, 0.8)'
  el.style.animation = 'floatUpAnimation 2.5s ease-out forwards'
  el.style.pointerEvents = 'none'
  el.style.whiteSpace = 'nowrap'
  el.style.zIndex = '10001'
  
  // Utiliser la position fournie ou chercher l'élément
  if (position) {
    el.style.left = (position.left + (Math.random() * 200 - 100)) + 'px'
    el.style.top = position.top + 'px'
  } else {
    // Fallback: chercher l'élément (pour compatibilité)
    const pnjElement = isMobile.value 
      ? document.querySelector('.requester-badge')
      : document.querySelector('.requester-item.active')
    
    if (pnjElement) {
      const rect = pnjElement.getBoundingClientRect()
      el.style.left = (rect.left + rect.width / 2 + (Math.random() * 200 - 100)) + 'px'
      el.style.top = (rect.top + rect.height / 2) + 'px'
    }
  }
  
  document.body.appendChild(el)
  
  // Nettoyer après l'animation
  setTimeout(() => el.remove(), 2500)
}

// Fonction pour créer les animations des récompenses
function createRewardAnimation(rewardType, amount, position = null) {
  const el = document.createElement('div')
  
  if (rewardType === 'potathune') {
    el.textContent = `+${amount} 💵`
    el.style.color = '#2e7d32'
    el.style.textShadow = '0 0 8px rgba(46, 125, 50, 0.8)'
  } else if (rewardType === 'xp') {
    el.textContent = `+${amount} ⭐`
    el.style.color = '#f57c00'
    el.style.textShadow = '0 0 8px rgba(245, 124, 0, 0.8)'
  }
  
  // Appliquer les styles inline directement
  el.style.position = 'fixed'
  el.style.fontSize = '22px'
  el.style.fontWeight = 'bold'
  el.style.fontFamily = "'Fredoka', sans-serif"
  el.style.animation = 'floatUpAnimation 2.5s ease-out forwards'
  el.style.pointerEvents = 'none'
  el.style.whiteSpace = 'nowrap'
  el.style.zIndex = '10001'
  
  // Utiliser la position fournie ou chercher l'élément
  if (position) {
    el.style.left = (position.left + (Math.random() * 150 - 75)) + 'px'
    el.style.top = (position.top - 20) + 'px'
  } else {
    // Fallback: chercher l'élément (pour compatibilité)
    const pnjElement = isMobile.value 
      ? document.querySelector('.requester-badge')
      : document.querySelector('.requester-item.active')
    
    if (pnjElement) {
      const rect = pnjElement.getBoundingClientRect()
      el.style.left = (rect.left + rect.width / 2 + (Math.random() * 150 - 75)) + 'px'
      el.style.top = (rect.top + rect.height / 2 - 20) + 'px'
    }
  }
  
  document.body.appendChild(el)
  
  // Nettoyer après l'animation
  setTimeout(() => el.remove(), 2500)
}

// Lifecycle
onMounted(() => {
  window.addEventListener('resize', updateMobile)
  timerInterval = setInterval(updateTimers, 1000)
  updateTimers()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMobile)
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.farming-requester {
  font-family: 'Fredoka', sans-serif;
}

/* Badge mobile - en haut à droite */
.requester-badge {
  position: fixed;
  right: 10px;
  top: 100px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(145deg, #8B4513, #5D3A1A);
  border: 3px solid #D4A574;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
   cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;  
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 100;
}

.requester-badge.has-new {
  animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
  0%, 100% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
  50% { box-shadow: 0 4px 20px rgba(255, 200, 0, 0.6); }
}

.badge-image {
  width: 45px;
  height: 45px;
  object-fit: contain;
}

.badge-notification {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 22px;
  height: 22px;
  background: #ff4444;
  color: white;
  font-weight: bold;
  font-size: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: bounce-notif 0.5s infinite alternate;
}

@keyframes bounce-notif {
  from { transform: scale(1); }
  to { transform: scale(1.15); }
}

/* Liste des personnages (desktop) - empilés en haut à droite */
.requesters-list {
  position: fixed;
  right: 10px;
  top: 140px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 50;
}

.requester-item {
   cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.requester-item:hover {
  transform: scale(1.1) translateY(-5px);
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.3));
}

.requester-item.active {
  transform: scale(1.15) translateY(-8px);
  filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.4));
}

.character-wrapper-small {
  position: relative;
  width: 65px;
  height: 75px;
}

.character-image-small {
  width: 55px;
  height: 70px;
  object-fit: contain;
  filter: drop-shadow(2px 3px 4px rgba(0, 0, 0, 0.3));
}

.character-notification-small {
  position: absolute;
  top: -4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: #ff4444;
  color: white;
  font-weight: bold;
  font-size: 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: bounce-notif 0.5s infinite alternate;
}

/* Icônes légumes au-dessus du personnage - style vrac diagonal */
.request-icons-preview {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
}

.preview-icon {
  font-size: 16px;
  filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.5));
  margin-left: -6px;
  position: relative;
}

.preview-icon:first-child {
  margin-left: 0;
}

.preview-icon:nth-child(1) {
  z-index: 3;
  transform: rotate(-10deg);
}

.preview-icon:nth-child(2) {
  z-index: 2;
  transform: rotate(5deg) translateY(-2px);
}

.preview-icon:nth-child(3) {
  z-index: 1;
  transform: rotate(-5deg) translateY(1px);
}

/* Bulle de dialogue desktop */
.speech-bubble-desktop {
  position: fixed;
  right: 85px;
  top: 120px;
  background: #FFFEF0;
  border: 3px solid #8B4513;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  padding: 15px;
  min-width: 240px;
  max-width: 280px;
  z-index: 40;
  animation: bubbleAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.speech-bubble-desktop::after {
  content: '';
  position: absolute;
  right: -12px;
  top: 25px;
  border: 10px solid transparent;
  border-left-color: #FFFEF0;
}

.speech-bubble-desktop::before {
  content: '';
  position: absolute;
  right: -16px;
  top: 23px;
  border: 12px solid transparent;
  border-left-color: #8B4513;
}

.close-bubble {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
  border: none;
   cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-bubble:hover {
  background: rgba(0, 0, 0, 0.2);
}

.dialogue-text {
  font-size: 13px;
  line-height: 1.4;
  color: #333;
  margin: 0 0 12px 0;
  font-style: italic;
  padding-right: 20px;
}

/* Requirements */
.requirements {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.requirement-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f5f0e0;
  padding: 4px 8px;
  border-radius: 8px;
  border: 2px solid #ccc;
}

.requirement-item.has-enough {
  border-color: #4CAF50;
  background: #e8f5e9;
}

.req-icon {
  font-size: 20px;
}

.req-quantity {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

/* Récompenses */
.rewards {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  padding: 6px 10px;
  background: linear-gradient(135deg, #fff9e6, #fff3cc);
  border-radius: 8px;
}

.reward-item {
  font-size: 13px;
  font-weight: 600;
}

.reward-item.potathune {
  color: #2e7d32;
}

.reward-item.xp {
  color: #f57c00;
}

/* Timer unifié */
.timer-info {
  padding: 6px 10px;
  background: #fff3e0;
  border-radius: 6px;
  margin-bottom: 10px;
  text-align: center;
}

.timer-text {
  font-size: 12px;
  color: #e65100;
  font-weight: 500;
}

/* Boutons */
.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-dismiss,
.btn-complete {
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
   cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: 'Fredoka', sans-serif;
  position: relative;
  overflow: hidden;
}

.btn-dismiss {
  background: #f5f5f5;
  border: 2px solid #ccc;
  color: #666;
}

.btn-dismiss:hover:not(:disabled) {
  background: #eee;
}

.btn-complete {
  background: linear-gradient(145deg, #4CAF50, #388E3C);
  border: none;
  color: white;
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.btn-complete:hover:not(:disabled) {
  background: linear-gradient(145deg, #66BB6A, #43A047);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.5);
  animation: buttonPulse 0.6s ease-out;
}

.btn-complete:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}

.btn-complete:disabled {
  background: #ccc;
    cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;
  opacity: 0.6;
}

@keyframes buttonPulse {
  0% {
    box-shadow: 0 6px 16px rgba(76, 175, 80, 0.5);
  }
  50% {
    box-shadow: 0 6px 24px rgba(76, 175, 80, 0.8);
  }
  100% {
    box-shadow: 0 6px 16px rgba(76, 175, 80, 0.5);
  }
}

/* ========== VERSION MOBILE FULLSCREEN ========== */
.fullscreen-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 15px;
  animation: slideUpFast 0.4s ease-out forwards;
}

.close-fullscreen {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 20px;
   cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
}

.request-nav {
  display: flex;
  align-items: center;
  gap: 15px;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #8B4513;
  color: white;
  border: none;
   cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  font-size: 14px;
  font-family: 'Fredoka', sans-serif;
}

.nav-btn:disabled {
  opacity: 0.4;
}

.nav-indicator {
  color: white;
  font-size: 16px;
}

.fullscreen-character {
  margin: 10px 0;
}

.character-image-large {
  width: 100px;
  height: 130px;
  object-fit: contain;
  filter: drop-shadow(3px 5px 8px rgba(0, 0, 0, 0.5));
}

.dialogue-text-large {
  color: white;
  font-size: 16px;
  font-style: italic;
  text-align: center;
  margin: 0;
  max-width: 300px;
}

.requirements-large {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.requirement-item-large {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 12px;
  border-radius: 10px;
  border: 2px solid #ccc;
}

.requirement-item-large.has-enough {
  border-color: #4CAF50;
  background: #e8f5e9;
}

.req-icon-large {
  font-size: 28px;
}

.req-quantity-large {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.rewards-large {
  display: flex;
  gap: 20px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #fff9e6, #fff3cc);
  border-radius: 10px;
}

.reward-item-large {
  font-size: 16px;
  font-weight: 600;
}

.reward-item-large.potathune {
  color: #2e7d32;
}

.reward-item-large.xp {
  color: #f57c00;
}

.timer-info-large {
  padding: 8px 16px;
  background: rgba(255, 243, 224, 0.9);
  border-radius: 8px;
  color: #e65100;
  font-size: 14px;
  font-weight: 500;
}

.action-buttons-large {
  display: flex;
  gap: 15px;
  width: 100%;
  max-width: 300px;
}

.btn-dismiss-large,
.btn-complete-large {
  flex: 1;
  padding: 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 16px;
   cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  font-family: 'Fredoka', sans-serif;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.btn-dismiss-large {
  background: #f5f5f5;
  border: 2px solid #ccc;
  color: #666;
}

.btn-complete-large {
  background: linear-gradient(145deg, #4CAF50, #388E3C);
  border: none;
  color: white;
  box-shadow: 0 6px 12px rgba(76, 175, 80, 0.4);
}

.btn-complete-large:hover:not(:disabled) {
  background: linear-gradient(145deg, #66BB6A, #43A047);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(76, 175, 80, 0.6);
  animation: buttonPulse 0.6s ease-out;
}

.btn-complete-large:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 3px 6px rgba(76, 175, 80, 0.4);
}

.btn-complete-large:disabled {
  background: #ccc;
  opacity: 0.6;
  cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;
}
/* Styles pour les textes du popup de dismiss */
.dismiss-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.dismiss-warning {
  font-size: 13px;
  color: #555;
  opacity: 1;
  margin: 0 0 15px 0;
}

.dismiss-buttons {
  display: flex;
  gap: 10px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  font-weight: 600;
   cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  font-family: 'Fredoka', sans-serif;
}

.btn-cancel {
  background: #f5f5f5;
  border: 2px solid #ccc;
  color: #666;
}

.btn-confirm {
  background: #ff7043;
  border: none;
  color: white;
}

/* Animation des légumes consommés */
.floating-vegetable {
  position: absolute;
  font-size: 24px;
  font-weight: bold;
  color: #ff6b6b;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  animation: floatVegetable 2.5s ease-out forwards;
}

@keyframes floatVegetable {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-150px) scale(0.8);
  }
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Animation d'apparition de la bulle avec bounce */
.speech-bubble-desktop {
  animation: bubbleAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes bubbleAppear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateX(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateX(0);
  }
}

/* Animation d'apparition du fullscreen */
.fullscreen-modal {
  animation: slideUpFast 0.4s ease-out;
}

@keyframes slideUpFast {
  0% {
    opacity: 0;
    transform: translateY(50px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Animation de récompense */
.reward-animation-container {
  position: fixed;
  pointer-events: none;
  z-index: 10000;
  width: 150px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
}

.reward-animation-container::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.15), transparent 70%);
  animation: glowPulse 2.5s ease-out forwards;
  pointer-events: none;
}

@keyframes glowPulse {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.5);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.5);
  }
}

@keyframes containerAppear {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.reward-particle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.8), rgba(255, 107, 107, 0.8));
  border-radius: 50%;
  top: 50%;
  left: 50%;
  animation: particleFloat 2.5s ease-out forwards;
  animation-delay: var(--particle-delay);
  opacity: 0.8;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.6), inset 0 0 4px rgba(255, 255, 255, 0.4);
}

@keyframes particleFloat {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) translate(0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) translate(var(--particle-x), var(--particle-y)) scale(0);
  }
}

.reward-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.animated-reward {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 48px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 1);
  animation: simpleFloatUp 3s ease-out forwards;
  white-space: nowrap;
}

.animated-reward.potathune {
  color: #FFD700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 1);
}

.animated-reward.xp {
  color: #FF6B6B;
  text-shadow: 0 0 10px rgba(255, 107, 107, 1);
}

.reward-emoji {
  font-size: 28px;
  display: inline-block;
}

.reward-amount {
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 1px;
}

@keyframes simpleFloatUp {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-200px);
  }
}

.floating-vegetable {
  position: absolute;
  font-size: 20px;
  font-weight: bold;
  font-family: 'Fredoka', sans-serif;
  color: #FF6B6B;
  text-shadow: 0 0 8px rgba(255, 107, 107, 0.8);
  animation: simpleFloatUp 2.5s ease-out forwards;
  pointer-events: none;
  white-space: nowrap;
}

@keyframes rewardAppear {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(40px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes rewardPop {
  0% {
    transform: scale(0.5);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes rewardBounce {
  0% {
    transform: scale(0) translateY(40px);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1) translateY(0);
  }
}

@keyframes fadeInRight {
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  85% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-200px);
  }
}

@keyframes slideUp {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  85% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-200px);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes bounce {
  0% {
    transform: scale(1) translateY(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1) translateY(-150px);
  }
}

@keyframes slideRight {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(100px);
  }
}

/* Mode sombre pour FarmingRequester */
:deep(.farming-view.dark-mode) .farming-requester .speech-bubble-desktop {
  background: linear-gradient(145deg, #3a3a3a, #2a2a2a);
  border-color: #8B7355;
  color: #E0E0E0;
}

:deep(.farming-view.dark-mode) .farming-requester .speech-title {
  color: #FFD700;
}

:deep(.farming-view.dark-mode) .farming-requester .speech-subtitle {
  color: #C0C0C0;
}

:deep(.farming-view.dark-mode) .farming-requester .requirement-item {
  background: rgba(0, 0, 0, 0.3);
  border-color: #8B7355;
  color: #E0E0E0;
}

:deep(.farming-view.dark-mode) .farming-requester .reward-item {
  background: rgba(0, 0, 0, 0.3);
  border-color: #8B7355;
  color: #E0E0E0;
}

:deep(.farming-view.dark-mode) .dismiss-text {
  color: #E0E0E0;
}

:deep(.farming-view.dark-mode) .dismiss-warning {
  color: #B0B0B0;
}

:deep(.farming-view.dark-mode) .btn-cancel {
  background: #4a4a4a;
  border-color: #8B7355;
  color: #E0E0E0;
}

:deep(.farming-view.dark-mode) .btn-confirm {
  background: #c05030;
}

:deep(.farming-view.dark-mode) .btn-confirm:hover {
  background: #d06540;
}

:deep(.farming-view.dark-mode) .btn-complete-large {
  background: linear-gradient(145deg, #2a5a2a, #1a3a1a);
  border-color: #4CAF50;
}

:deep(.farming-view.dark-mode) .discard-popup-container {
  background: rgba(30, 30, 30, 0.95);
  border-color: #A0826D;
}

:deep(.farming-view.dark-mode) .discard-popup-container h2 {
  color: #FFD700;
}

:deep(.farming-view.dark-mode) .discard-popup-container label {
  color: #E0E0E0;
}

:deep(.farming-view.dark-mode) .discard-popup-container input {
  background: rgba(100, 100, 100, 0.3);
  border-color: #8B7355;
  color: #E0E0E0;
}

:deep(.farming-view.dark-mode) .discard-popup-container button {
  background: linear-gradient(145deg, #5a4a3a, #3a2a1a);
  border-color: #A0826D;
  color: #E0E0E0;
}

:deep(.farming-view.dark-mode) .discard-popup-container button:hover {
  background: linear-gradient(145deg, #6a5a4a, #4a3a2a);
}
</style>

<style>
/* Animations globales pour les éléments créés dynamiquement */
@keyframes floatUpAnimation {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-200px);
  }
}
</style>
