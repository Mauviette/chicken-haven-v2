<template>
  <Popup @close="emit('close')">
    <div class="assign-popup">
      <h3 class="title">Sélectionner une poule</h3>
      <div class="subtitle-row">
        <div class="subtitle">Poste : {{ poste.nom }}</div>
        <input
          v-model="search"
          class="search-bar"
          type="text"
          placeholder="Rechercher une poule..."
        />
      </div>

      <div v-if="loading" class="loading">Chargement...</div>

      <div v-else-if="filteredPoules.length === 0" class="empty">
        Aucune poule disponible 💤
      </div>

      <div class="poules-list">
        <ChickenPostCard
          v-for="poule in filteredPoules"
          :key="poule.especeId"
          :poule="poule"
          :espece="especeData[poule.especeId]"
          :image="getImage(poule.especeId)"
          :posteStat="poste.statPrincipale || 'charisme'"
          @assigner="assigner(poule)"
        />
      </div>
    </div>
  </Popup>
</template>

<script setup>
import Popup from '@/components/menu/Popup.vue'
import ChickenPostCard from '@/components/chicken/ChickenPostCard.vue'
import { ref, computed, onMounted } from 'vue'
import { usePoules } from '@/composables/usePoules'
import { useAuth } from '@/composables/useAuth'

const props = defineProps({
  poste: Object
})
const emit = defineEmits(['close', 'assign'])

const { especeData, getImage } = usePoules()
const { token } = useAuth()

const poulesDisponibles = ref([])
const loading = ref(true)
const search = ref('')

async function fetchDisponibles() {
  loading.value = true
  try {
    const res = await fetch('/api/poules', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    const data = await res.json()
    poulesDisponibles.value = data.filter(p =>
      p.statutEnergie.etat === 'disponible' &&
      p.owned &&
      !p.posteOccupe
    )
  } catch (err) {
    console.error('Erreur chargement poules assignables', err)
    window.$toast('Impossible de charger les poules disponibles.','error')
  } finally {
    loading.value = false
  }
}

const filteredPoules = computed(() =>
  poulesDisponibles.value
    .filter(p => especeData[p.especeId])
    .filter(p => {
      const espece = especeData[p.especeId]
      const nom = espece?.nom?.toLowerCase() || ''
      const talent = espece?.talent?.toLowerCase() || ''
      const searchVal = search.value.toLowerCase()
      return (
        nom.includes(searchVal) ||
        talent.includes(searchVal)
      )
    })
)

function assigner(poule) {
  emit('close')
  emit('assign', poule)
}

onMounted(fetchDisponibles)
</script>

<style scoped>
.assign-popup {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 30%;
  max-width: 600px;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: #fffbe5;
  margin: 0;
}

.subtitle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.subtitle {
  font-size: 14px;
  color: #ffdca0;
  margin-bottom: 4px;
}

.search-bar {
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1.5px solid #ffd58f;
  background: #fffaf1;
  color: #7a3e10;
  outline: none;
  min-width: 0;
  width: 180px;
  transition: border-color 0.15s;
}
.search-bar:focus {
  border-color: #ffc66e;
}

.loading,
.empty {
  text-align: center;
  font-size: 14px;
  color: #fff0d6;
  margin-top: 12px;
}

.poules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  /* Personnalisation de la scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #ffd58f #fffaf1;
  padding-right: 16px; /* Ajoute un espace à droite pour décaler la scrollbar */
  box-sizing: border-box;
}

/* Pour Chrome, Edge, Safari */
.poules-list::-webkit-scrollbar {
  width: 8px;
  background: #fffaf1;
  margin-left: 8px; /* Décale la scrollbar vers la droite */
}
.poules-list::-webkit-scrollbar-thumb {
  background: #ffd58f;
  border-radius: 6px;
}
.poules-list::-webkit-scrollbar-thumb:hover {
  background: #ffc66e;
}
/* Masquer les flèches (buttons) de la scrollbar sur Chrome/Edge/Safari */
.poules-list::-webkit-scrollbar-button {
  display: none;
  height: 0;
  width: 0;
}

/* Si le composant Popup a un style de fond/conteneur, tu peux aussi le cibler ici */
:deep(.popup-content), :deep(.popup-container) {
  min-width: 440px !important;
  max-width: 600px !important;
}
</style>
