<!-- components/artifacts/ArtifactReplacementPopup.vue -->
<template>
  <Popup @close="emit('close')">
    <div class="artifact-replacement">
      <h3>Équipement plein</h3>
      <p>Votre équipement est déjà complet. Choisissez quel artefact remplacer :</p>

      <div class="current-artifacts">
        <!-- Wrap each artifact with Tooltip so hovering shows effect -->
        <Tooltip
          v-for="(artifactId, index) in currentArtifacts"
          :key="index"
          :text="getArtifactTooltip(artifactId)"
          position="right"
          :followMouse="false"
        >
          <div
            class="artifact-item"
            :class="{ selected: selectedIndex === index }"
            @click="selectedIndex = index"
          >
            <div class="artifact-icon">{{ getArtifactIcon(artifactId) }}</div>
            <div class="artifact-info">
              <div class="artifact-name">{{ getArtifactName(artifactId) }}</div>
              <div class="artifact-rarete" :class="getArtifactRarity(artifactId)">
                {{ formatRareté(getArtifactRarity(artifactId)) }}
              </div>
            </div>
          </div>
        </Tooltip>
      </div>

      <div class="actions">
        <button class="btn cancel" @click="emit('close')">Annuler</button>
        <button
          class="btn confirm"
          :disabled="selectedIndex === -1"
          @click="confirmReplacement"
        >
          Remplacer {{ selectedIndex !== -1 ? getArtifactName(currentArtifacts[selectedIndex]) : '' }}
        </button>
      </div>
    </div>
  </Popup>
</template>

<script setup>
import { ref } from 'vue'
import Popup from '@/components/menu/Popup.vue'
import Tooltip from '@/components/menu/Tooltip.vue'
import { useGameData } from '@/composables/useGameData'

const emit = defineEmits(['close', 'replace'])

const props = defineProps({
  currentArtifacts: Array,
  newArtifactId: String
})

const { artifacts } = useGameData()

const selectedIndex = ref(-1)

const getArtifactIcon = (artifactId) => {
  if (!artifactId) return '❖'
  return artifacts.value?.[artifactId]?.icon || '❖'
}

const getArtifactName = (artifactId) => {
  if (!artifactId) return 'Vide'
  return artifacts.value?.[artifactId]?.name || artifactId
}

const getArtifactRarity = (artifactId) => {
  if (!artifactId) return 'commune'
  return artifacts.value?.[artifactId]?.rarete || 'commune'
}

const formatRareté = (r) => {
  const map = {
    commune: 'Commun',
    rare: 'Rare',
    epique: 'Épique',
    legendaire: 'Légendaire'
  }
  return map[r] || r
}

const getArtifactTooltip = (artifactId) => {
  if (!artifactId) return 'Emplacement vide'
  const art = artifacts.value?.[artifactId]
  if (!art) return 'Artefact inconnu'
  return art.description || 'Aucune description'
}

const confirmReplacement = () => {
  if (selectedIndex.value !== -1) {
    emit('replace', selectedIndex.value)
  }
}
</script>

<style scoped>
.artifact-replacement {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Fredoka', sans-serif;
  color: #fff9e5;
}

h3 {
  margin: 0;
  text-align: center;
  color: #ffe6b5;
}

p {
  margin: 0;
  text-align: center;
  color: #ffd58f;
}

.current-artifacts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.artifact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 2px solid #ffc66e;
  border-radius: 12px;
  background: rgba(255, 249, 229, 0.1);
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: all 0.2s ease;
}

.artifact-item:hover {
  background: rgba(255, 249, 229, 0.2);
  transform: translateY(-1px);
}

.artifact-item.selected {
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.2);
}

.artifact-icon {
  width: 48px;
  height: 48px;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 2px solid #ffc66e;
  background: #fffaf1;
}

.artifact-info {
  flex: 1;
}

.artifact-name {
  font-weight: bold;
  font-size: 16px;
}

.artifact-rarete {
  font-size: 14px;
  color: #ffd58f;
}

.artifact-rarete.commune {
  color: #c2c2c2;
}
.artifact-rarete.rare {
  color: #7bc0ff;
}
.artifact-rarete.epique {
  color: #c98bff;
}
.artifact-rarete.legendaire {
  color: gold;
}
.artifact-rarete.unique {
  color: #ff0000;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 2px solid;
  font-family: 'Fredoka', sans-serif;
  font-weight: bold;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: all 0.2s ease;
}

.btn.cancel {
  background: #fff1f1;
  border-color: #ffb3b3;
  color: #d32f2f;
}

.btn.confirm {
  background: #e6f3ff;
  border-color: #8bb4d6;
  color: #1976d2;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;
}

/* Dark Mode */
.dark-mode .artifact-replacement {
  color: #e0e0e0 !important;
}

.dark-mode h3 {
  color: #ffb366 !important;
}

.dark-mode p {
  color: #cc9966 !important;
}

.dark-mode .artifact-item {
  border: 2px solid #555 !important;
  background: rgba(42, 42, 42, 0.8) !important;
}

.dark-mode .artifact-item:hover {
  background: rgba(64, 64, 64, 0.8) !important;
}

.dark-mode .artifact-item.selected {
  border-color: #ff6b6b !important;
  background: rgba(255, 107, 107, 0.2) !important;
}

.dark-mode .artifact-icon {
  border: 2px solid #555 !important;
  background: #2a2a2a !important;
}

.dark-mode .artifact-rarete {
  color: #cc9966 !important;
}

.dark-mode .btn.cancel {
  background: #441111 !important;
  border-color: #ff6666 !important;
  color: #ffaaaa !important;
}

.dark-mode .btn.confirm {
  background: #1a3a5c !important;
  border-color: #4a90e2 !important;
  color: #87ceeb !important;
}

/* Apocalypse Mode */
.apocalypse-mode .artifact-replacement {
  color: #ffaaaa !important;
}

.apocalypse-mode h3 {
  color: #ff6666 !important;
}

.apocalypse-mode p {
  color: #ff8888 !important;
}

.apocalypse-mode .artifact-item {
  border: 2px solid #ff6666 !important;
  background: rgba(102, 0, 0, 0.2) !important;
}

.apocalypse-mode .artifact-item:hover {
  background: rgba(128, 0, 0, 0.3) !important;
}

.apocalypse-mode .artifact-item.selected {
  border-color: #ff4444 !important;
  background: rgba(255, 68, 68, 0.3) !important;
}

.apocalypse-mode .artifact-icon {
  border: 2px solid #ff6666 !important;
  background: #2a0a0a !important;
}

.apocalypse-mode .artifact-rarete {
  color: #ff8888 !important;
}

.apocalypse-mode .btn.cancel {
  background: #441111 !important;
  border-color: #ff6666 !important;
  color: #ffaaaa !important;
}

.apocalypse-mode .btn.confirm {
  background: #1a1a33 !important;
  border-color: #6666ff !important;
  color: #aaaaff !important;
}

</style>