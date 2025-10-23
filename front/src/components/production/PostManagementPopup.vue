<script setup>
import Popup from '@/components/menu/Popup.vue'
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'

const props = defineProps({
  poste: { type: Object, required: true }
})
const emit = defineEmits(['close', 'start-mission'])

const { token } = useAuth() // tu dois avoir ça via un composable existant
const poulesDisponibles = ref([])
const slotPouleMap = ref({})
const selectedPoules = ref({})

async function fetchPoulesDisponibles() {
  try {
    const response = await fetch('/api/poules', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    const data = await response.json()

    // Filtrage ici
    poulesDisponibles.value = data.filter(poule =>
      poule.statutEnergie.etat === 'disponible' &&
      poule.posteOccupe == null &&
      poule.owned
    ).map(poule => ({
      ...poule,
      nom: resolveNom(poule.especeId),
      talent: resolveTalent(poule.especeId)
    }))

  } catch (err) {
    window.$toast('Impossible de charger les poules : ' + err, 'error')
  }
}

function resolveNom(especeId) {
  // TODO : remplacer par tes vraies données d'espèces
  return especeId === 'poule-rousse' ? 'Roussette' : especeId
}
function resolveTalent(especeId) {
  // TODO : à relier à especeData
  return 'Talent inconnu'
}

onMounted(fetchPoulesDisponibles)

function assignerPoule(slot) {
  const poule = selectedPoules.value[slot]
  if (!poule) return
  slotPouleMap.value[slot] = poule
  selectedPoules.value[slot] = null
}
</script>
