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
          <h2 class="username">{{ profile.username }}</h2>
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
            <div class="stat-row"><span>🥚 Oeufs récoltés</span><b>{{ profile.stats?.totalEggsCollected ?? 0 }}</b></div>
            <div class="stat-row"><span>🐣 Poules découvertes</span><b>{{ (profile.stats?.chickenFound ?? 0) }} / {{ totalEspeces }}</b></div>
            <div class="stat-row"><span>📦 Boîtes ouvertes</span><b>{{ profile.stats?.totalBoxesOpened ?? 0 }}</b></div>
            <div class="stat-row"><span>🥚 Max en un clic</span><b>{{ profile.stats?.maxEggsInOneClick ?? 0 }}</b></div>
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
import Popup from '@/components/menu/Popup.vue'
import { apiGet, apiPatch } from '@/utils/api.js'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const profile = ref(null)
const copied = ref(false)
const copyTooltip = ref('Cliquer pour copier')
const meProfileId = ref('')
const isOwnProfile = computed(() => meProfileId.value && profile.value && String(profile.value.profileId).toUpperCase() === String(meProfileId.value).toUpperCase())
const avatarPopup = ref(false)

// Game data for species/talents + helpers
const { especies, talents, getImage, getNom, getTalentEffectSync, poules, hiddenImage } = usePoules()
const totalEspeces = computed(() => Object.keys(especies.value || {}).length)
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
    } catch (_) {}
  })()
})

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

function toRoman(num) {
  const romans = ['','I','II','III','IV','V','VI','VII','VIII','IX','X']
  if (typeof num !== 'number' || num < 0) return ''
  return romans[num] || String(num)
}

function talentLabel(slot) {
  try {
    const id = slot?.especeId
    if (!id) return ''
    const tName = especies.value?.[id]?.talent || ''
    const lvl = Number(slot?.niveauTalent || 0)
    const roman = lvl ? toRoman(lvl) : ''
    return roman ? `${tName} ${roman}` : tName
  } catch (_) { return '' }
}
</script>

<style scoped>
.profile-view {
  padding: 24px;
  background: #f9f3e8;
  color: #4b2e06;
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
  background: #fffaf1;
  border: 2px solid #ffc66e;
  border-radius: 12px;
  padding: 12px 14px;
}
.avatar-block.clickable { cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer; }
.avatar-block.clickable .avatar { transition: filter .12s ease; }
.avatar-block.clickable:hover .avatar { filter: grayscale(0.4) brightness(0.95); }
.avatar { width: 72px; height: 72px; border-radius: 12px; border: 3px solid #ffc66e; background: #fff; object-fit: cover; user-select: none; }
.avatar.placeholder { display: grid; place-items: center; font-size: 36px; }
.identity { display: grid; gap: 4px; }
.username { margin: 0; font-size: 20px; }
.id {
  font-family: monospace;
  background: #fffaf1;
  border: 1px solid #ffd99a;
  padding: 4px 8px;
  border-radius: 6px;
  width: fit-content;
}
.id.copyable {   cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto; transition: transform .05s ease; }
.id.copyable:active { transform: translateY(1px); }
.since { opacity: .8; font-size: 13px; }
.online { font-size: 13px; opacity: .9; }
.online.live { color: #118a00; font-weight: 600; }
.level-pill {
  background: #e6f3ff;
  border: 2px solid #8bb4d6;
  color: #234;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 600;
}

.stats-card {
  background: #fffaf1;
  border: 2px solid #ffc66e;
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
.stat-row + .stat-row { border-top: 1px dashed #ffd99a; }
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
  color: #6d3c00;
}
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.team-slot {
  background: #fffaf1;
  border: 2px solid #ffc66e;
  border-radius: 10px;
  padding: 8px;
}
.slot-vertical { display: grid; grid-template-rows: auto auto auto; justify-items: center; align-items: start; gap: 6px; text-align: center; }
.slot-vertical.empty { opacity: .6; font-style: italic; }
.slot-chicken { width: 56px; height: 56px; image-rendering: pixelated; border-radius: 8px; border: 1px solid #ffd99a; background: #fff; }
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
}

.avatar-popup h3 {
  margin-top: 0;
  margin-bottom: 16px;
  text-align: center;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 10px;
}

/* Mobile responsive pour le popup d'avatar */
@media (max-width: 768px) {
  .avatar-popup {
    max-width: 95vw;
    max-height: 85vh;
    padding: 16px;
  }
  
  .avatar-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
  }
  
  .avatar-item img {
    width: 48px;
    height: 48px;
  }
}
.avatar-item {
  background: #fffaf1;
  border: 2px solid #ffc66e;
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
.avatar-item img { width: 64px; height: 64px; image-rendering: pixelated; border-radius: 8px; background: #fff; border: 1px solid #ffd99a; }
.avatar-item .label { font-size: 12px; opacity: .9; text-align: center; }
.avatar-item.equipped img { outline: 3px solid #fff; box-shadow: 0 0 0 2px #ffc66e; }
</style>
