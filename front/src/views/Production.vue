<template>
  <div class="production-view">
        <ProductionPost
          v-for="poste in postes"
          :key="poste.id"
          :poste="poste"
          @ouvrir="ouvrirPopup"
        />

        <AssignPopup
          v-if="posteActif"
          :poste="posteActif"
          @close="posteActif = null"
          @assign="poule => assignerPouleAuPoste(poule, posteActif)"
        />
  </div>
</template>

<script setup>
import ProductionPost from '@/components/production/ProductionPost.vue'
import PostManagementPopup from '@/components/production/PostManagementPopup.vue'
import AssignPopup from '@/components/production/AssignPopup.vue'
import { usePoules } from '@/composables/usePoules'
import { usePost } from '@/composables/usePost' // Import du composable
import { useAuth } from '@/composables/useAuth';
import { ref } from 'vue'

const { token } = useAuth();

// Récupération des postes dynamiques via le composable
const { postes } = usePost()

const posteActif = ref(null)

function ouvrirPopup(poste) {
  posteActif.value = poste
}

function fermerPopup() {
  posteActif.value = null
}

async function assignerPouleAuPoste(poule, poste) {
  if (!poste) {
    console.error('Poste is null or undefined:', poste);
    window.$toast?.error('Erreur : Poste non valide.');
    return;
  }

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
        dureeMinutes: 120 // ou dynamiquement calculé selon stat
      })
    });

    if (!res.ok) throw new Error('Erreur assignation');
    const result = await res.json();

    window.$toast?.success(`${especeData[poule.especeId].nom} travaille sur ${poste.nom} !`);

    // Optionnel : refresh local
    await refreshPoules();
  } catch (err) {
    console.error(err);
    window.$toast?.error('Erreur lors de l’assignation.');
  }
}

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
