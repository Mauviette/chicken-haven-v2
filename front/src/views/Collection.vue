<template>
  <div class="collection-view">

    <div class="header-bar">
      <h2 class="section-title" style="margin-bottom: 0;">🐔 Ma Collection
        <span class="team-indicator" v-if="team">— Équipe: {{ usedSlots }}/{{ team.maxSlots }}</span>
      </h2>
      <div class="controls" style="margin-bottom: 0;">
        <input v-model="searchQuery" type="text" placeholder="Rechercher une poule..." class="search-input" />
        <select v-model="sortKey" class="sort-select">
          <option value="rarete">Rareté</option>
          <option value="quantite">Quantité</option>
        </select>
        <button @click="toggleSortOrder" class="sort-order">
          {{ sortOrder === 'asc' ? '⬆️' : '⬇️' }}
        </button>
      </div>
    </div>

    <div class="poules-grid">
      <div v-if="gameDataLoading" class="loading-message">
        Chargement des données...
      </div>
      <ChickenCard
        v-else
        v-for="poule in filteredPoules"
        :key="poule.especeId"
        :poule="poule"
        :espece="especeData[poule.especeId]"
        :image="getImage(poule.especeId)"
        :hiddenImage="hiddenImage"
        :class="{ 'non-clickable': !poule.owned }"
        @click="poule.owned ? openDetail(poule) : null"
      />
    </div>

    <ChickenDetail
      v-if="selectedPoule && especeData"
      :poule="selectedPoule"
      :espece="especeData[selectedPoule.especeId]"
      :image="getImage(selectedPoule.especeId)"
      @close="closeDetail"
    />

  <br/><br/><br/>
  </div>
</template>

<script setup>
import ChickenCard from '@/components/chicken/ChickenCard.vue'
import ChickenDetail from '../components/chicken/ChickenDetail.vue'
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePoules } from '@/composables/usePoules'
import { useGameData } from '@/composables/useGameData'
import { usePlayer } from '@/composables/usePlayer'

onMounted(() => {
  // Collection initialisée
})

const selectedPoule = ref(null)
const searchQuery = ref('')
// Tri par défaut: quantité décroissante
const sortKey = ref('quantite')
const sortOrder = ref('desc')

const {
  poules,
  getImage,
  hiddenImage,
  clearNew
} = usePoules()

const { especies: especeData, loading: gameDataLoading } = useGameData()
const { team, fetchTeam } = usePlayer()
const route = useRoute()
const router = useRouter()

// Définir rareteOrder avant son utilisation
const rareteOrder = {
  commune: 1,
  rare: 2,
  epique: 3,
  legendaire: 4,
}

onMounted(async () => {
  if (localStorage.getItem('token')) {
    await fetchTeam()
  }
})

// Les données sont gérées par les composables useGameData et usePoules

function normalizeText(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function closeDetail() {
  selectedPoule.value = null
  // Nettoyer le paramètre detail dans l'URL
  if (route.query.detail) {
    const q = { ...route.query }
    delete q.detail
    router.replace({ query: q })
  }
}

function openDetail(poule) {
  // Trouver la référence originale dans le store
  const origin = (poules.value || []).find(p => p.especeId === poule.especeId) || poule
  // Si la poule est marquée "nouvelle", nettoyer le flag côté front et back sur l'originale
  if (origin.new) {
    clearNew(origin.especeId)
  }
  selectedPoule.value = origin
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const filteredPoules = computed(() => {
  // Attendre que les données soient chargées
  if (gameDataLoading.value || !especeData || !poules.value) {
    return []
  }

  const query = normalizeText(searchQuery.value.trim())

  // Enrichissement avec score de pertinence et infos
  const withMeta = poules.value.map((poule) => {
    const espece = especeData[poule.especeId]
    const matchScore = query && espece
      ? [
          espece.nom,
          espece.talent,
          espece.categorie,
          espece.rarete,
        ].some((val) => normalizeText(val).includes(query)) ? 1 : 0
      : 0


    return {
      ...poule,
      _matchScore: matchScore,
      _isUnlocked: poule.owned, // Utiliser le flag owned au lieu de quantite > -1
      _inTeam: (team.value?.slots || []).some(s => s?.especeId === poule.especeId),
      _rareteIndex: rareteOrder[espece?.rarete] || 0,
    }
  })

  // Séparation débloquées vs non débloquées
  const unlocked = withMeta.filter(p => p._isUnlocked)
  const locked = withMeta.filter(p => !p._isUnlocked)

  // Tri des poules débloquées
  unlocked.sort((a, b) => {
    if (b._matchScore !== a._matchScore) return b._matchScore - a._matchScore

    // Prioriser les poules en équipe
    if (a._inTeam !== b._inTeam) return a._inTeam ? -1 : 1

    if (sortKey.value) {
      const valA = sortKey.value === 'rarete' ? a._rareteIndex : (a[sortKey.value] ?? 0)
      const valB = sortKey.value === 'rarete' ? b._rareteIndex : (b[sortKey.value] ?? 0)
      const dir = sortOrder.value === 'asc' ? 1 : -1
      if (valA !== valB) return (valA - valB) * dir
    }

    return 0
  })

  // Optionnel : tri secondaire des non débloquées par rareté
  locked.sort((a, b) => a._rareteIndex - b._rareteIndex)

  return [...unlocked, ...locked]
})



const usedSlots = computed(() => (team.value?.slots || []).filter(s => s?.especeId).length)

// Ouvrir automatiquement la fiche si ?detail=especeId est présent
watch(
  () => [route.query.detail, poules.value, especeData, gameDataLoading.value],
  () => {
    const id = route.query.detail
    if (!id) return
    if (gameDataLoading.value) return
    const p = (poules.value || []).find(p => p.especeId === id)
    if (p) {
      openDetail(p)
    }
  },
  { immediate: true }
)

// Garder la sélection synchronisée si la liste des poules change (ex: après amélioration)
watch(
  () => poules.value,
  (list) => {
    if (!selectedPoule.value) return
    const id = selectedPoule.value.especeId
    const updated = (list || []).find(p => p.especeId === id)
    if (updated && updated !== selectedPoule.value) {
      selectedPoule.value = updated
    }
  },
  { deep: false }
)
</script>

<style scoped>

.collection-view {
  padding: 24px;
  background: #f9f3e8;
  font-family: 'Fredoka', sans-serif;
  flex: 1;
  width: 100%;
  overflow-y: auto;
  max-height: 100vh;
  box-sizing: border-box;
}


.section-title {
  font-size: 20px;
  margin-bottom: 20px;
  color: #6d3c00;
}

.team-indicator {
  font-size: 14px;
  color: #8B4513;
  margin-left: 10px;
}

.poules-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: flex-start;
}

.info {
  text-align: center;
  font-size: 14px;
  color: #5c2c08;
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  max-width: 60%;
  margin-right: 50px;
}

@media (max-width: 600px) {
  .search-input {
    display: none;
  }
}


.search-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 2px solid #ffc66e;
  font-family: 'Fredoka', sans-serif;
  cursor: url('@/assets/ui/cursor/bracket_a_vertical.png') 0 0, auto;
}

.sort-select,
.sort-order {
  padding: 8px 12px;
  border-radius: 8px;
  border: 2px solid #ffc66e;
  background: #fffaf1;
  font-family: 'Fredoka', sans-serif;
    cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.loading-message {
  text-align: center;
  font-size: 16px;
  color: #6d3c00;
  padding: 40px;
  width: 100%;
}

/* Styles pour les poules non cliquables */
.non-clickable {
  pointer-events: none;
  opacity: 0.6;
  filter: grayscale(0.3);
  cursor: not-allowed !important;
}

.non-clickable:hover {
  transform: none !important;
  box-shadow: none !important;
}

</style>