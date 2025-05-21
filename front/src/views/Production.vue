<template>
  <div class="production-view">
    <div class="production-posts">
      <ProductionPost
  v-for="poste in postesAffiches"
  :key="poste.id"
  :poste="poste"
  :placeholder="poste.placeholder"
  @ouvrir="!poste.placeholder ? ouvrirPopup(poste) : null"
/>


      <AssignPopup
        v-if="posteActif"
        :poste="posteActif"
        @close="posteActif = null"
        @assign="poule => assignerPouleAuPoste(poule, posteActif)"
      />
    </div>
  </div>
</template>

<script setup>
import ProductionPost from '@/components/production/ProductionPost.vue'
import AssignPopup from '@/components/production/AssignPopup.vue'
import { usePost } from '@/composables/usePost'
import { useAuth } from '@/composables/useAuth'
import { ref, computed } from 'vue'

const { token } = useAuth()
const {
  postes,
  postesDuJoueur
} = usePost()

const posteActif = ref(null)

function ouvrirPopup(poste) {
  posteActif.value = poste
}

async function assignerPouleAuPoste(poule, poste) {
  try {
    const res = await fetch('/api/production/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      },
      body: JSON.stringify({
        especeId: poule.especeId,
        posteId: poste.id,
        dureeMinutes: 120 // à adapter
      })
    })

    if (!res.ok) throw new Error('Erreur assignation')
    const result = await res.json()
    window.$toast?.success(`${poule.nom} travaille sur ${poste.nom} !`)
  } catch (err) {
    console.error(err)
    window.$toast('Erreur lors de l’assignation.', 'error')
  }
}


// Liste unique des types de postes débloqués par le joueur
const typesDebloques = computed(() => {
  // Dans postesDuJoueur, le type correspond à l'id du poste dans postes
  const types = postesDuJoueur.value.map(p => p.type)
  return [...new Set(types)]
})

// On génère une liste de postes avec `placeholder: true` si non débloqué
const postesAffiches = computed(() => {
  return postes.value.map(p => {
    // Vérifie si le poste est débloqué en comparant son id avec les types dans postesDuJoueur
    // Ou si le poste a debloque: true dans sa définition
    const estDebloque = typesDebloques.value.includes(p.id) || p.debloque === true
    return {
      ...p,
      placeholder: !estDebloque
    }
  })
})
</script>

<style scoped>
.production-view {
  padding: 24px;
  background: #f9f3e8;
  font-family: 'Fredoka', sans-serif;
  flex: 1;
  width: 100%;
  overflow-y: auto;
  max-height: 100vh;
  box-sizing: border-box;
}

.production-posts {
  width: 100%;
}

/* Style pour le placeholder ??? */
.poste-locked {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  background: #f3e9d6;
  border-radius: 12px;
  border: 2px dashed #c2c2c2;
  margin-bottom: 18px;
}
.poste-locked-title {
  font-size: 2rem;
  color: #c2c2c2;
  font-family: 'Fredoka', sans-serif;
  letter-spacing: 2px;
}

.section-title {
  font-size: 20px;
  margin-bottom: 20px;
  color: #6d3c00;
}

.posts-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: flex-start;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
</style>
