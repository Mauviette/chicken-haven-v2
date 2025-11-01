<template>
  <Popup @close="emit('close')">
    <div class="artifact-detail">
      <!-- Contenu principal -->
      <div class="header">
        <div class="artifact-icon-large">{{ artifactData?.icon || '❖' }}</div>
        <div class="header-text">
          <h2 class="name" style="margin: 0;">
            {{ artifactData?.name || 'Artefact' }}
          </h2>
          <div class="rarete" :class="artifactData?.rarete">
            {{ formatRareté(artifactData?.rarete) }}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="value">{{ artifactData?.description || 'Aucune description disponible.' }}</div>
      </div>

      <div class="actions">
        <template v-if="!isEquipped">
          <button 
            v-if="canEquip"
            class="btn equip" 
            @click="onEquipDirect"
            :disabled="miningLocked"
            :title="miningLocked ? 'Impossible d\'équiper pendant une partie de minage active' : ''"
          >
            Équiper
          </button>
          <button 
            v-if="!canEquip"
            class="btn replace" 
            @click="onEquip"
            :disabled="false"
            title="Remplacer un artefact équipé"
          >
            Remplacer
          </button>
        </template>
        <button 
          v-else
          class="btn unequip" 
          @click="onUnequip"
          :disabled="miningLocked"
          :title="miningLocked ? 'Impossible de déséquiper pendant une partie de minage active' : 'Déséquiper cet artefact'"
        >
          {{ miningLocked ? 'Minage en cours' : 'Déséquiper' }}
        </button>
      </div>

      <!-- Popup de remplacement -->
      <ArtifactReplacementPopup
        v-if="showReplacementPopup"
        :currentArtifacts="currentEquippedArtifacts"
        :newArtifactId="props.artifact?.artifactId"
        @close="showReplacementPopup = false"
        @replace="onReplaceArtifact"
      />
    </div>
  </Popup>
</template>

<script setup>
import Popup from '@/components/menu/Popup.vue'
import { computed } from 'vue'
import { usePlayer } from '@/composables/usePlayer'
import { useSound } from '@/composables/useSound'
import { apiGet } from '@/utils/api' // <-- nouveau

import { ref, onMounted, onUnmounted } from 'vue'
import ArtifactReplacementPopup from './ArtifactReplacementPopup.vue'

const emit = defineEmits(['close', 'updated'])

const props = defineProps({
  artifact: Object,
  artifactData: Object
})

const { artifactSlots, equipArtifact, unequipArtifact } = usePlayer()
const { click, confirm, close: sndClose } = useSound()

const isEquipped = computed(() => {
  const equipped = artifactSlots.value?.equipped || []
  return equipped.includes(props.artifact?.artifactId)
})

const canEquip = computed(() => {
  if (isEquipped.value) return false
  const equipped = artifactSlots.value?.equipped || []
  const slotsCount = artifactSlots.value?.slotsCount || 0
  // Peut équiper si il reste des emplacements vides
  const usedSlots = equipped.filter(id => id !== null && id !== '').length
  return usedSlots < slotsCount
})

// Artefacts actuellement équipés pour le popup de remplacement
const currentEquippedArtifacts = computed(() => {
  return artifactSlots.value?.equipped || []
})

// NOUVEAU : état local pour savoir si le minage bloque l'équipement (vérifié côté serveur)
const miningLocked = ref(!!(typeof window !== 'undefined' && window.__miningActive))

// NOUVEAU : popup de remplacement
const showReplacementPopup = ref(false)

function onMiningActiveChanged(e) {
  // si on reçoit active=false => on libère immédiatement
  // si active=true => re-vérifier côté serveur (car il faut distinguer "active mais terminée")
  try {
    const active = !!(e?.detail?.active)
    if (!active) {
      miningLocked.value = false
      return
    }
    // re-vérifier l'état réel côté serveur
    checkMiningLock()
  } catch (_) {}
}

onMounted(() => {
  try {
    window.addEventListener('mining-active-changed', onMiningActiveChanged)
    // initial server-side check to be authoritative
    checkMiningLock().catch(()=>{ miningLocked.value = !!(window.__miningActive) })
  } catch (_) {}
})

onUnmounted(() => {
  try { window.removeEventListener('mining-active-changed', onMiningActiveChanged) } catch (_) {}
})

// Vérifie côté serveur si le minage doit vraiment bloquer l'équipement.
// On considère que le minage bloque seulement si server.active === true ET
// que currentToolIndex < tools.length (il reste des outils à jouer).
async function checkMiningLock() {
  try {
    const data = await apiGet('/api/mining/state')
    if (!data) {
      miningLocked.value = !!(window.__miningActive)
      return
    }
    const serverActive = !!data.active
    const game = data.game
    if (!serverActive) {
      miningLocked.value = false
      return
    }
    // Si la partie expose une structure game, considérer finie si currentToolIndex >= tools.length
    if (game && Array.isArray(game.tools)) {
      const idx = Number(game.currentToolIndex || 0)
      const total = (game.tools || []).length
      miningLocked.value = !(idx >= total)
    } else {
      // fallback : si server dit active mais pas de détail, on considère bloqué
      miningLocked.value = true
    }
  } catch (err) {
    console.warn('checkMiningLock failed:', err)
    // en cas d'erreur réseau, ne pas autoriser une opération dangereuse : conserver heuristique locale
    miningLocked.value = !!(window.__miningActive)
  }
}

function formatRareté(r) {
  const map = {
    commune: 'Commun',
    rare: 'Rare',
    epique: 'Épique',
    legendaire: 'Légendaire',
    unique: 'Unique'
  }
  return map[r] || r
}

async function onEquipDirect() {
  // Équiper directement dans un slot vide
  await checkMiningLock()
  if (miningLocked.value) {
    try { window.$toast?.("Impossible d'équiper pendant une partie de minage active", 'error') } catch (_) {}
    return
  }

  try {
    click()
    await equipArtifact(props.artifact.artifactId)
    confirm()
    emit('updated')
  } catch (err) {
    console.error('Erreur lors de l\'équipement:', err)
    window.$toast?.(err?.response?.data?.error || 'Erreur lors de l\'équipement', 'error')
  }
}

async function onEquip() {
  // Ouvrir le popup de remplacement
  showReplacementPopup.value = true
}

async function onUnequip() {
  try {
    click()
    await unequipArtifact(props.artifact.artifactId)
    confirm()
    emit('updated')
  } catch (err) {
    console.error('Erreur lors du déséquipement:', err)
    window.$toast?.(err?.response?.data?.error || 'Erreur lors du déséquipement', 'error')
  }
}

async function onReplaceArtifact(index) {
  showReplacementPopup.value = false

  try {
    click()
    // D'abord déséquiper l'ancien artefact
    const oldArtifactId = currentEquippedArtifacts.value[index]
    if (oldArtifactId && oldArtifactId !== '') {
      await unequipArtifact(oldArtifactId)
    }
    // Puis équiper le nouveau
    await equipArtifact(props.artifact.artifactId)
    confirm()
    emit('updated')
  } catch (err) {
    console.error('Erreur lors du remplacement:', err)
    window.$toast?.(err?.response?.data?.error || 'Erreur lors du remplacement', 'error')
  }
}
</script>

<style scoped>
.artifact-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Fredoka', sans-serif;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.artifact-icon-large {
  padding: 5px;
  width: 48px;
  height: 48px;
  font-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 2px solid #ffc66e;
  background-color: #eaeb9e;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='32' viewBox='0 0 16 32'%3E%3Cg fill='%23ffca35' fill-opacity='0.33'%3E%3Cpath fill-rule='evenodd' d='M0 24h4v2H0v-2zm0 4h6v2H0v-2zm0-8h2v2H0v-2zM0 0h4v2H0V0zm0 4h2v2H0V4zm16 20h-6v2h6v-2zm0 4H8v2h8v-2zm0-8h-4v2h4v-2zm0-20h-6v2h6V0zm0 4h-4v2h4V4zm-2 12h2v2h-2v-2zm0-8h2v2h-2V8zM2 8h10v2H2V8zm0 8h10v2H2v-2zm-2-4h14v2H0v-2zm4-8h6v2H4V4zm0 16h6v2H4v-2zM6 0h2v2H6V0zm0 24h2v2H6v-2z'/%3E%3C/g%3E%3C/svg%3E");
  box-sizing: content-box;
}

.header-text {
  display: flex;
  flex-direction: column;
}

.name {
  margin: 0;
  font-size: 20px;
  color: #fff9e5;
}

.rarete {
  font-size: 14px;
  color: #ffd58f;
}

.rarete.commune {
  color: #c2c2c2;
}
.rarete.rare {
  color: #7bc0ff;
}
.rarete.epique {
  color: #c98bff;
}
.rarete.legendaire {
  color: gold;
}
.rarete.unique {
  color: #ff0000;
}

.section {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  background: rgba(255, 249, 229, 0.1);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #ffdfac;
  color: #fff9e5;
}

.label {
  font-weight: bold;
  color: #ffe6b5;
}

.value {
  color: #fffbe5;
  text-align: right;
  flex: 1;
  margin-left: 12px;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 12px;
  border-radius: 8px;
  border: 2px solid #ffc66e;
  background: #fffaf1;
  font-family: 'Fredoka', sans-serif;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
}

.btn.equip { 
  background: #e9ffe6; 
  border-color: #8ed68b; 
}

.btn.replace { 
  background: #fff3cd; 
  border-color: #ffc107; 
  color: #856404;
}

.btn.unequip { 
  background: #fff1f1; 
  border-color: #ffb3b3; 
}

.btn:disabled {
  opacity: 0.5;
  cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;
}

/* Mode Apocalypse */
.apocalypse-mode .btn {
  background: #2a1111;
  border-color: #ff6666;
  color: #ffaaaa;
}

.apocalypse-mode .btn.equip {
  background: #1a1515;
  border-color: #ff8888;
}

.apocalypse-mode .btn.replace {
  background: #2a1a1a;
  border-color: #ffaa44;
  color: #ffcc88;
}

.apocalypse-mode .btn.unequip {
  background: #331111;
  border-color: #ff6666;
}

</style>
