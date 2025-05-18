<template>
    <Popup @close="emit('close')">
      <div class="assign-popup">
        <h3 class="title">Sélectionner une poule</h3>
        <div class="subtitle">Poste : {{ poste.nom }}</div>
  
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
        p.quantite > 0 &&
        !p.posteOccupe
      )
    } catch (err) {
      console.error('Erreur chargement poules assignables', err)
      window.$toast?.error('Impossible de charger les poules disponibles.')
    } finally {
      loading.value = false
    }
  }
  
  const filteredPoules = computed(() =>
    poulesDisponibles.value.filter(p => especeData[p.especeId])
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
  }
  
  .title {
    font-size: 20px;
    font-weight: bold;
    color: #fffbe5;
    margin: 0;
  }
  
  .subtitle {
    font-size: 14px;
    color: #ffdca0;
    margin-bottom: 4px;
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
  }
  </style>
