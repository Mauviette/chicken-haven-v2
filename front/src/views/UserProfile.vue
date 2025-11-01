<template>
  <div class="profile-view">
    <div v-if="loading" class="loading">Chargement du profil…</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="!profile" class="error">Profil introuvable.</div>
    <div v-else class="content">
      <div class="header-card">
        <div class="avatar-block" :class="{ clickable: isOwnProfile }" @click="isOwnProfile && openAvatarPopup()">
          <img :src="avatarSrc" alt="avatar" class="avatar" draggable="false" />
        </div>
        <div class="identity">
          <div class="name-section">
            <h2 class="display-name" v-if="!editingDisplayName">
              {{ profile.displayName || profile.username }}
              <Tooltip v-if="profile?.apocalypse" text="Cet utilisateur a choisi d'avoir la vie dure.">
                <span class="apocalypse-badge">🔥</span>
              </Tooltip>
              <Tooltip v-if="profile?.dev" text="Ce compte est un compte développeur, il n'est pas comptabilisé dans les classements.">
                <span class="dev-badge">👨‍💻</span>
              </Tooltip>
              <button v-if="isOwnProfile" class="edit-name-btn" @click="startEditDisplayName" title="Modifier le nom d'affichage">
                <span class="edit-icon">✏️</span>
                Modifier
              </button>
            </h2>
            <div v-else class="edit-name-container">
              <div class="edit-name-form">
                <input 
                  v-model="newDisplayName" 
                  class="edit-name-input" 
                  :class="{ 'input-error': displayNameError }"
                  placeholder="Nouveau nom d'affichage"
                  maxlength="30"
                  @input="validateDisplayName"
                  @keyup.enter="saveDisplayName"
                  @keyup.escape="cancelEditDisplayName"
                  ref="displayNameInput"
                />
                <div class="edit-name-buttons">
                  <button 
                    class="action-button save-btn" 
                    @click="saveDisplayName" 
                    :class="{ disabled: !newDisplayName.trim() || !!displayNameError || validatingDisplayName }"
                    :disabled="!newDisplayName.trim() || !!displayNameError || validatingDisplayName"
                  >
                    <span v-if="validatingDisplayName">⏳ Validation...</span>
                    <span v-else>✓ Confirmer</span>
                  </button>
                  <button class="action-button cancel-btn" @click="cancelEditDisplayName">
                    ✗ Annuler
                  </button>
                </div>
              </div>
              <div v-if="displayNameError" class="field-error">{{ displayNameError }}</div>
            </div>
            <div class="real-username">{{ profile.username }}</div>
          </div>
          <button class="id copyable" @click="copyId" :title="copyTooltip">
            ID: {{ profile.profileId }}
          </button>
          <div class="since">Inscrit le {{ formatDate(profile.createdAt) }}</div>
          <div class="online" :class="{ live: isOnline }">{{ onlineStatus }}</div>
        </div>
        <div class="level-pill">🫐 Niveau <strong>{{ profile.experience?.level ?? 1 }}</strong></div>
      </div>

      <div class="two-cols">
        <div class="left">
          <h3 class="section-title">📊 Statistiques</h3>
          <div class="stats-card">
            <div class="stat-row"><span>🏆 Succès obtenus</span><b>{{ formatNumber(profile.stats?.achievementsCompleted ?? 0) }} / {{ totalAchievements }} ({{ Math.round(((profile.stats?.achievementsCompleted ?? 0) / Math.max(1, totalAchievements)) * 100) }}%)</b></div>
            <div class="stat-row"><span>🥚 Oeufs récoltés</span><b>{{ formatEggsCollected(profile.stats?.totalEggsCollected ?? 0, profile?.apocalypse) }}</b></div>
            <div class="stat-row"><span>🐣 Poules découvertes</span><b>{{ formatNumber(profile.stats?.chickenFound ?? 0) }} / {{ totalEspeces }}</b></div>
            <div class="stat-row"><span>📦 Boîtes ouvertes</span><b>{{ formatNumber(profile.stats?.totalBoxesOpened ?? 0) }}</b></div>
            <div class="stat-row"><span>🥚 Max en un clic</span><b>{{ formatMaxEggsInClick(profile.stats?.maxEggsInOneClick ?? 0, profile?.apocalypse) }}</b></div>

            <!-- NOUVELLES STATS DE MINAGE -->
            <div class="stat-row"><span>🎮 Parties de minage jouées</span><b>{{ formatNumber(profile.achievements?.progress?.miningGamesPlayed ?? 0) }}</b></div>
            <div class="stat-row"><span>💎 Artéfacts de minage trouvés</span><b>{{ profile.achievements?.progress?.miningArtifactsFound ?? 0 }} / 8 ({{ Math.round(((profile.achievements?.progress?.miningArtifactsFound ?? 0) / 8) * 100) }}%)</b></div>
            <div class="stat-row"><span>⛏️ Cases brisées</span><b>{{ formatNumber(profile.achievements?.progress?.miningCellsBroken ?? 0) }}</b></div>

            <!-- NOUVEAU : afficher les meilleures stats d'équipe historiques provenant des achievements.progress -->
            <div class="stat-row"><span>⚡ Meilleure énergie d'équipe</span><b>{{ formatNumber(profile.achievements?.progress?.bestTeamEnergy ?? 0) }}</b></div>
            <div class="stat-row"><span>🧠 Meilleure intelligence d'équipe</span><b>{{ formatNumber(profile.achievements?.progress?.bestTeamIntelligence ?? 0) }}</b></div>
            <div class="stat-row"><span>✨ Meilleur charisme d'équipe</span><b>{{ formatNumber(profile.achievements?.progress?.bestTeamCharisme ?? 0) }}</b></div>
            
            <!-- NOUVEAU : afficher le nombre de cadeaux de poules collectés -->
            <div class="stat-row"><span>🎁 Cadeaux de poules collectés</span><b>{{ formatNumber(profile.achievements?.progress?.chickenGiftsCollected ?? 0) }}</b></div>
            
            <!-- NOUVEAU : afficher le nombre d'utilisations de capacités de poules -->
            <div class="stat-row"><span>⚡ Capacités de poules utilisées</span><b>{{ formatNumber(profile.achievements?.progress?.chickenAbilitiesUsed ?? 0) }}</b></div>

            <!-- NOUVEAU : afficher les tomates pourries reçues en mode apocalypse -->
            <div v-if="profile?.apocalypse" class="stat-row"><span>🍅 Tomates pourries reçues</span><b>{{ formatNumber(profile.achievements?.progress?.rottenTomatoesReceived ?? 0) }}</b></div>
          </div>
        </div>
        <div class="right">
          <h3 class="section-title">🐾 Équipe actuelle</h3>
          <div class="team-grid">
            <div v-for="(slot, i) in (profile.team?.slots || [])" :key="i" class="team-slot">
              <div v-if="slot?.especeId" class="slot-vertical">
                <Tooltip :text="teamTooltip(slot)">
                  <img :src="getImage(slot.especeId)" :alt="getNom(slot.especeId)" class="slot-chicken" draggable="false" />
                </Tooltip>
                <div class="slot-name">{{ getNom(slot.especeId) }}</div>
                <div class="slot-talent">{{ talentLabel(slot) }}</div>
              </div>
              <div v-else class="slot-vertical empty">Vide</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <br/>
    <br/>
    <br/>
    <br/>

  </div>
  
    <Popup v-if="avatarPopup" @close="avatarPopup=false">
      <div class="avatar-popup">
        <h3>Choisir un avatar</h3>
        <div class="avatar-grid">
          <div class="avatar-item" :class="{ equipped: isEquipped('hidden') }" @click="chooseAvatar('hidden')">
            <img :src="hiddenAvatar" alt="hidden" />
          </div>
          <div
            v-for="p in ownedPoules"
            :key="p.especeId"
            class="avatar-item"
            :class="{ equipped: isEquipped(p.especeId) }"
            @click="chooseAvatar(p.especeId)"
          >
            <img :src="getImage(p.especeId)" :alt="getNom(p.especeId)" />
          </div>
        </div>
      </div>
    </Popup>
  
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import Tooltip from '@/components/menu/Tooltip.vue'
import { usePoules } from '@/composables/usePoules'
import { useGameData } from '@/composables/useGameData'
import Popup from '@/components/menu/Popup.vue'
import { apiGet, apiPatch } from '@/utils/api.js'
import { containsForbiddenWords } from '@/utils/forbiddenWords.js'
import { formatNumber } from '@/utils/format.js'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const profile = ref(null)
const copied = ref(false)
const copyTooltip = ref('Cliquer pour copier')
const meProfileId = ref('')
const isOwnProfile = computed(() => meProfileId.value && profile.value && String(profile.value.profileId).toUpperCase() === String(meProfileId.value).toUpperCase())
const avatarPopup = ref(false)

// Variables pour l'édition du displayName
const editingDisplayName = ref(false)
const newDisplayName = ref('')
const displayNameInput = ref(null)
const displayNameError = ref('')
const validatingDisplayName = ref(false)
let validationTimeout = null

// Game data for species/talents + helpers
const { especies, talents, getImage, getNom, getTalentEffectSync, poules, hiddenImage } = usePoules()
const { achievements } = useGameData()
const totalEspeces = computed(() => Object.keys(especies.value || {}).length)
const totalAchievements = computed(() => Object.keys(achievements.value || {}).length)
const ownedPoules = computed(() => (poules.value || []).filter(p => p?.owned))
const hiddenAvatar = computed(() => hiddenImage)

// Source d'image correcte pour l'avatar affiché en tête
const avatarSrc = computed(() => {
  const a = profile.value?.avatar
  if (!a || a === 'hidden') return hiddenAvatar.value
  // a est un especeId, convertir via getImage
  return getImage(String(a))
})

const isOnline = computed(() => {
  const last = profile.value?.lastSeen ? new Date(profile.value.lastSeen).getTime() : 0
  if (!last) return false
  const diffMs = Date.now() - last
  return diffMs < 5 * 60 * 1000 // 5 minutes
})

const onlineStatus = computed(() => {
  if (isOnline.value) return 'En ligne'
  const last = profile.value?.lastSeen ? new Date(profile.value.lastSeen).getTime() : 0
  if (!last) return 'Hors ligne'
  const diff = Date.now() - last
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `En ligne il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `En ligne il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return `En ligne il y a ${days} j`
})

async function loadProfile(id) {
  try {
    loading.value = true
    error.value = ''
    profile.value = await apiGet(`/api/user/profile/${encodeURIComponent(id)}`)
  } catch (e) {
    console.error(e)
    error.value = 'Erreur de chargement du profil.'
  } finally {
    loading.value = false
  }
}

// NOUVEAU : charger le statut des achievements seulement pour le profil propre
async function loadAchievementsStatusIfOwn() {
  try {
    if (!isOwnProfile.value) return
    const data = await apiGet('/api/achievements/status')
    if (data && profile.value) {
      profile.value = { ...profile.value, achievements: data }
    }
  } catch (e) {
    console.warn('Impossible de charger achievements status:', e)
  }
}

onMounted(() => {
  const id = String(route.params.id || '').toUpperCase()
  loadProfile(id)
  // Charger mon profilId pour savoir si la page est la mienne
  ;(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const me = await apiGet('/api/user/me')
      meProfileId.value = String(me.profileId || '').toUpperCase()
      // Apocalypse mode is now immutable, no need to update it
      // Après avoir obtenu mon profileId, tenter de charger les achievements si c'est mon profil
      await loadAchievementsStatusIfOwn()
    } catch (_) {}
  })()
})

// Appeler aussi la récupération des achievements quand on devient "own profile" ou que le profil est rechargé
watch([isOwnProfile, () => profile.value?.profileId], async ([own]) => {
  if (own) {
    await loadAchievementsStatusIfOwn()
  }
}, { immediate: false })

watch(() => route.params.id, (newId) => {
  if (!newId) return
  loadProfile(String(newId).toUpperCase())
})

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString()
  } catch { return '' }
}

async function copyId() {
  try {
    if (!profile.value?.profileId) return
    await navigator.clipboard.writeText(String(profile.value.profileId))
    copied.value = true
    copyTooltip.value = 'Copié !'
    try { window.$toast?.('ID copié', 'success') } catch (_) {}
    setTimeout(() => { copied.value = false; copyTooltip.value = 'Cliquer pour copier' }, 1500)
  } catch (_) {}
}

function openAvatarPopup() {
  if (!isOwnProfile.value) return
  avatarPopup.value = true
}

function isEquipped(val) {
  const cur = profile.value?.avatar || 'hidden'
  return String(cur) === String(val)
}

async function chooseAvatar(val) {
  try {
    if (!isOwnProfile.value) return
    const token = localStorage.getItem('token')
    if (!token) { window.$toast?.('Connecte-toi pour changer l\'avatar', 'error'); return }
    const data = await apiPatch('/api/user/me/avatar', { avatar: val })
    if (!data?.success) {
      window.$toast?.(data?.error || 'Impossible de changer l\'avatar', 'error')
      return
    }
    profile.value = { ...profile.value, avatar: data.avatar }
    window.$toast?.('Avatar mis à jour', 'success')
    try { window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { avatar: data.avatar || 'hidden' } })) } catch (_) {}
    avatarPopup.value = false
  } catch (e) {
    console.error(e)
    window.$toast?.('Erreur réseau', 'error')
  }
}

function teamTooltip(slot) {
  try {
    const id = slot?.especeId
    if (!id) return ''
    const name = getNom(id)
    const st = especies.value?.[id]?.stats || {}
    const tName = especies.value?.[id]?.talent
    // Utiliser le niveau réel transmis côté public si disponible
    const lvl = Number(slot?.niveauTalent || 0) || 1
    const fakePoule = { especeId: id, quantite: 1, niveauTalent: lvl }
    const effect = getTalentEffectSync(fakePoule) || (talents.value?.[tName]?.description || '')
    const title = name ? `<strong>${name}</strong>` : ''
    const statsLine = `🧠${st.intelligence ?? 0} ⚡${st.energie ?? 0} ✨${st.charisme ?? 0}`
    const parts = []
    if (title) parts.push(title)
    if (statsLine) parts.push(statsLine)
    if (effect) parts.push(effect)
    return parts.join('<br>')
  } catch (_) { return '' }
}

function formatEggsCollected(totalEggs, isApocalypse) {
  if (!isApocalypse) return formatNumber(totalEggs)
  // En mode apocalypse, les gains sont réduits de 90%, donc les stats affichent 10% des vrais gains
  // Pour afficher la valeur "réelle", on multiplie par 10
  const realEggs = totalEggs * 10
  return `${formatNumber(totalEggs)} (${formatNumber(realEggs)} en mode normal)`
}

function formatMaxEggsInClick(maxEggs, isApocalypse) {
  if (!isApocalypse) return formatNumber(maxEggs)
  // Même logique pour le max en un clic
  const realMax = maxEggs * 10
  return `${formatNumber(maxEggs)} (${formatNumber(realMax)} en mode normal)`
}

function talentLabel(slot) {
  try {
    const id = slot?.especeId
    if (!id) return ''
    const tName = especies.value?.[id]?.talent || ''
    const rarete = especies.value?.[id]?.rarete
    const lvl = Number(slot?.niveauTalent || 0)
    const roman = (lvl && rarete !== 'unique') ? toRoman(lvl) : ''
    return roman ? `${tName} ${roman}` : tName
  } catch (_) { return '' }
}

function startEditDisplayName() {
  if (!isOwnProfile.value) return
  newDisplayName.value = profile.value?.displayName || profile.value?.username || ''
  displayNameError.value = ''
  editingDisplayName.value = true
  // Focus l'input au prochain tick
  setTimeout(() => {
    displayNameInput.value?.focus()
  }, 100)
}

function cancelEditDisplayName() {
  if (validationTimeout) {
    clearTimeout(validationTimeout)
    validationTimeout = null
  }
  editingDisplayName.value = false
  newDisplayName.value = ''
  displayNameError.value = ''
  validatingDisplayName.value = false
}

// Validation du displayName avec les mêmes règles que l'inscription
async function validateDisplayName() {
  // Annuler la validation précédente si elle est en cours
  if (validationTimeout) {
    clearTimeout(validationTimeout)
  }

  const value = newDisplayName.value.trim()
  
  if (!value) {
    displayNameError.value = ''
    validatingDisplayName.value = false
    return
  }

  // Validations synchrones d'abord
  if (value.length < 2) {
    displayNameError.value = 'Minimum 2 caractères'
    validatingDisplayName.value = false
    return
  }

  if (value.length > 30) {
    displayNameError.value = 'Maximum 30 caractères'
    validatingDisplayName.value = false
    return
  }

  if (!/^[a-zA-Z0-9À-ÿ\s_.,:;!?()[\]{}+\-*\/@#$%^&'"`~|\\]+$/.test(value)) {
    displayNameError.value = 'Certains caractères ne sont pas autorisés'
    validatingDisplayName.value = false
    return
  }

  // Validation asynchrone avec debounce
  validatingDisplayName.value = true
  displayNameError.value = '' // Effacer l'erreur pendant la validation
  
  validationTimeout = setTimeout(async () => {
    try {
      const hasForbiddenWord = await containsForbiddenWords(value)
      if (hasForbiddenWord) {
        displayNameError.value = 'Nom d\'affichage non autorisé'
      } else {
        displayNameError.value = ''
      }
    } catch (error) {
      console.warn('Erreur validation mots interdits:', error)
      displayNameError.value = ''
    }
    validatingDisplayName.value = false
  }, 500) // Attendre 500ms après la dernière frappe
}

// Enregistrer le nouveau displayName (appel API)
async function saveDisplayName() {
  try {
    if (!isOwnProfile.value) return
    const value = (newDisplayName.value || '').trim()
    if (!value) return
    // Ne pas envoyer si une erreur de validation est présente
    if (displayNameError.value) {
      window.$toast?.(displayNameError.value, 'error')
      return
    }

    // Annuler debounce de validation en cours
    if (validationTimeout) {
      clearTimeout(validationTimeout)
      validationTimeout = null
    }

    validatingDisplayName.value = true

    // Appel API. Hypothèse raisonnable : endpoint '/api/user/me/displayName' (similaire à avatar endpoint)
    const resp = await apiPatch('/api/user/me/displayName', { displayName: value })

    if (!resp || !resp.success) {
      const err = resp?.error || 'Impossible de mettre à jour le nom d\'affichage'
      window.$toast?.(err, 'error')
      validatingDisplayName.value = false
      return
    }

    // Mettre à jour l'objet de profil localement
    profile.value = { ...profile.value, displayName: resp.displayName || value }
    window.$toast?.('Nom d\'affichage mis à jour', 'success')
    editingDisplayName.value = false
    newDisplayName.value = ''
  } catch (e) {
    console.error('Erreur saveDisplayName:', e)
    window.$toast?.('Erreur réseau', 'error')
  } finally {
    validatingDisplayName.value = false
  }
}
</script>

<style scoped>
.profile-view {
  padding: 24px;
  background: var(--bg-primary);
  color: var(--text-primary);
  /* Prend tout l'espace disponible au centre, scrolle à l'intérieur */
  flex: 1 1 auto;
  min-height: 0; /* important pour laisser le scroll interne fonctionner */
  overflow: auto;
  font-family: 'Fredoka', sans-serif;
  user-select: none;
}
.loading, .error { text-align: center; padding: 40px; }

.content { display: grid; gap: 16px; }

.header-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  padding: 12px 14px;
}
.avatar-block.clickable { cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer; }
.avatar-block.clickable .avatar { transition: filter .12s ease; }
.avatar-block.clickable:hover .avatar { filter: grayscale(0.4) brightness(0.95); }
.avatar { width: 72px; height: 72px; border-radius: 12px; border: 3px solid var(--border-primary); background: var(--bg-primary); object-fit: cover; user-select: none; }
.avatar.placeholder { display: grid; place-items: center; font-size: 36px; }
.identity { display: grid; gap: 4px; }
.name-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.display-name {
  margin: 0;
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-name-btn {
  background-color: var(--button-bg);
  border: 2px solid var(--border-primary);
  color: var(--button-text);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-family: 'Fredoka', sans-serif;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: transform 0.1s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.edit-name-btn:hover {
  background-color: var(--button-hover);
  transform: translateY(-1px);
}

.edit-name-btn:active {
  transform: translateY(1px);
}

.edit-icon {
  font-size: 11px;
}

.edit-name-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 4px;
}

.edit-name-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.edit-name-input {
  padding: 10px 12px;
  border: 2px solid var(--border-primary);
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Fredoka', sans-serif;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  width: 100%;
  max-width: 280px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.edit-name-input:focus {
  outline: none;
  border-color: var(--border-tertiary);
  box-shadow: 0 0 8px rgba(255, 170, 0, 0.3);
  background-color: var(--bg-primary);
}

.edit-name-input.input-error {
  border-color: var(--error-border);
  background-color: var(--error-bg);
}

.edit-name-input.input-error:focus {
  box-shadow: 0 0 8px rgba(255, 107, 107, 0.3);
}

.edit-name-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.field-error {
  color: var(--error-text);
  font-size: 12px;
  margin-top: -4px;
  font-weight: 500;
  background: rgba(255, 107, 107, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  border-left: 3px solid var(--error-border);
}

/* Utiliser le style ActionButton pour les boutons de confirmation */
.action-button {
  background-color: var(--button-bg);
  border: 2px solid var(--border-primary);
  color: var(--button-text);
  border-radius: 10px;
  padding: 8px 12px;
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: transform 0.1s ease;
  font-weight: 500;
  white-space: nowrap;
}

.action-button:hover:not(.disabled) {
  background-color: var(--button-hover);
  transform: translateY(-1px);
}

.action-button:active:not(.disabled) {
  transform: translateY(2px);
  box-shadow: 0 0px 0 #5c2c08;
}

.action-button.disabled {
  background-color: var(--text-primary);
  color: var(--text-secondary);
  cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;
  opacity: 0.7;
}

.save-btn {
  background-color: var(--success-bg);
  border-color: var(--success-border);
}

.save-btn:hover:not(.disabled) {
  background-color: var(--success-bg);
}

.cancel-btn {
  background-color: var(--cancel-bg);
  border-color: var(--cancel-border);
}

.cancel-btn:hover:not(.disabled) {
  background-color: var(--cancel-bg);
}

.real-username {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: normal;
  font-family: monospace;
}
.id {
  font-family: monospace;
  background: var(--bg-secondary);
  border: 1px solid var(--border-tertiary);
  padding: 4px 8px;
  border-radius: 6px;
  width: fit-content;
}
.id.copyable {   cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto; transition: transform .05s ease; }
.id.copyable:active { transform: translateY(1px); }
.since { opacity: .8; font-size: 13px; }
.online { font-size: 13px; opacity: .9; }
.online.live { color: var(--success-text); font-weight: 600; }
.level-pill {
  background: var(--level-bg);
  border: 2px solid var(--level-border);
  color: var(--level-text);
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 600;
}

.stats-card {
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  padding: 8px;
  display: grid;
}
.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
}
.stat-row + .stat-row { border-top: 1px dashed var(--border-tertiary); }
.stat-row span { opacity: .85; }
.stat-row b { font-size: 16px; }

.two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.section-title {
  font-size: 18px;
  margin: 6px 0 10px;
  color: var(--text-header);
}
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.team-slot {
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 10px;
  padding: 8px;
}
.slot-vertical { display: grid; grid-template-rows: auto auto auto; justify-items: center; align-items: start; gap: 6px; text-align: center; }
.slot-vertical.empty { opacity: .6; font-style: italic; }
.slot-chicken { width: 56px; height: 56px; image-rendering: pixelated; border-radius: 8px; border: 1px solid var(--border-tertiary); background: var(--bg-primary); }
.slot-name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slot-talent { font-size: 12px; opacity: .95; }

@media (max-width: 800px) {
  .two-cols { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .profile-view {
    padding: 16px;
  }
  
  .header-card { 
    grid-template-columns: auto 1fr; 
    gap: 12px;
  }
  
  .level-pill { 
    grid-column: 1 / -1; 
    justify-self: start; 
  }
  
  .avatar {
    width: 56px;
    height: 56px;
  }
  
  .username {
    font-size: 18px;
  }
  
  .team-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }
  
  .slot-chicken {
    width: 48px;
    height: 48px;
  }
}

/* Popup avatars */
.avatar-popup { 
  max-width: 720px;
  max-height: 80vh;
  overflow-y: auto;
  scrollbar-gutter: stable;
  -webkit-overflow-scrolling: touch;
}

.avatar-popup h3 {
  margin-top: 0;
  margin-bottom: 16px;
  text-align: center;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(80px, 1fr));
  gap: 10px;
}

/* Mobile responsive pour le popup d'avatar */
@media (max-width: 768px) {
  .avatar-popup {
    max-width: 95vw;
    max-height: 85vh;
    padding: 16px;
  }
  
  /* Sur mobile, conserver 3 colonnes mais réduire les minima pour tenir l'espace */
  .avatar-grid {
    grid-template-columns: repeat(3, minmax(64px, 1fr));
    gap: 8px;
  }
  
  .avatar-item img {
    width: 48px;
    height: 48px;
  }
}
.avatar-item {
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 10px;
  padding: 8px;
  display: grid;
  place-items: center;
  gap: 6px;
  user-select: none;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: transform .05s ease;
}
.avatar-item:active { transform: translateY(1px); }
.avatar-item img { width: 64px; height: 64px; image-rendering: pixelated; border-radius: 8px; background: var(--bg-primary); border: 1px solid var(--border-tertiary); }
.avatar-item .label { font-size: 12px; opacity: .9; text-align: center; }
.avatar-item.equipped img { outline: 3px solid #fff; box-shadow: 0 0 0 2px var(--border-primary); }


/* Badges*/
.dev-badge {
  display: inline-block;
  margin-left: 8px;
  font-size: 16px;
  filter: drop-shadow(0 0 1px rgba(0, 123, 255, 0.8));
}

.apocalypse-badge {
  display: inline-block;
  margin-left: 8px;
  font-size: 16px;
  filter: drop-shadow(0 0 1px rgba(255, 100, 0, 0.8));
}
</style>
