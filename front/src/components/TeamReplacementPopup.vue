<!-- components/TeamReplacementPopup.vue -->
<template>
  <Popup @close="emit('close')">
    <div class="team-replacement">
      <h3>Équipe pleine</h3>
      <p>Votre équipe est déjà complète. Choisissez quel membre remplacer :</p>
      
      <div class="current-team">
        <!-- Wrap each member with Tooltip so hovering shows talent effect -->
        <Tooltip
          v-for="(member, index) in currentTeamWithStatus"
          :key="index"
          :text="getTalentTooltip(member?.especeId)"
          position="right"
          :followMouse="false"
        >
          <div
            class="team-member"
            :class="{ 
              selected: selectedIndex === index, 
              disabled: member.disabled 
            }"
            @click="!member.disabled && (selectedIndex = index)"
          >
            <img 
              :src="getMemberImage(member?.especeId)" 
              :alt="getMemberName(member?.especeId)"
              class="member-image"
              :class="{ disabled: member.disabled }"
            />
            <div class="member-info">
              <div class="member-name">{{ getMemberName(member?.especeId) }}</div>
              <div class="member-talent">{{ getMemberTalent(member?.especeId) }}</div>
              <div v-if="member.disabled" class="disabled-text">{{ member.disabledReason }}</div>
            </div>
          </div>
        </Tooltip>
      </div>
      
      <div class="actions">
        <button class="btn cancel" @click="emit('close')">Annuler</button>
        <button 
          class="btn confirm" 
          :disabled="selectedIndex === -1 || (selectedIndex !== -1 && currentTeamWithStatus[selectedIndex]?.disabled)"
          @click="confirmReplacement"
        >
          Remplacer {{ selectedIndex !== -1 && !currentTeamWithStatus[selectedIndex]?.disabled ? getMemberName(currentTeamWithStatus[selectedIndex]?.especeId) : '' }}
        </button>
      </div>
    </div>
  </Popup>
</template>

<script setup>
import { ref, computed } from 'vue'
import Popup from '@/components/menu/Popup.vue'
import Tooltip from '@/components/menu/Tooltip.vue' // <-- nouveau import
import { useGameData } from '@/composables/useGameData'
import { usePoules } from '@/composables/usePoules'
import { usePlayer } from '@/composables/usePlayer'

const emit = defineEmits(['close', 'replace'])

const props = defineProps({
  currentTeam: Array,
  newChickenId: String
})

const { especies, talents, getEspeceInfo, getTalentInfo } = useGameData()
const { getTalentDisplayNameSync, getTalentEffectSync, getImage, poules } = usePoules()
const { cooldowns, apocalypse } = usePlayer()

const selectedIndex = ref(-1)

// Talents activables avec cooldown
const activableTalents = ['Maligne', 'Joyeuse', 'Rapide']

// Vérifie si une poule a un talent activable en cooldown
function hasActiveCooldown(especeId) {
  if (!especeId) return false
  const talentName = especies.value?.[especeId]?.talent
  if (!talentName || !activableTalents.includes(talentName)) return false
  
  const cooldownKey = `talent_${talentName}`
  const cooldownEnd = cooldowns.value?.[cooldownKey]
  if (!cooldownEnd) return false
  
  const now = new Date()
  const endTime = new Date(cooldownEnd)
  return endTime > now
}

// Membres avec statut disabled (en mode apocalypse, marquer ceux avec cooldown actif)
const currentTeamWithStatus = computed(() => {
  const result = (props.currentTeam || []).map((member, index) => {
    const disabled = apocalypse.value && hasActiveCooldown(member?.especeId)
    return {
      ...member,
      disabled,
      disabledReason: disabled ? 'Capacité en recharge (mode Apocalypse)' : null
    }
  })
  
  // Si l'élément sélectionné est maintenant disabled, le désélectionner
  if (selectedIndex.value !== -1 && result[selectedIndex.value]?.disabled) {
    selectedIndex.value = -1
  }
  
  return result
})

const getMemberImage = (especeId) => {
  if (!especeId) return '/assets/chickens/hidden/basic.png'
  return getImage(especeId)
}

const getMemberName = (especeId) => {
  if (!especeId) return 'Vide'
  return especies.value?.[especeId]?.nom || especeId
}

const getMemberTalent = (especeId) => {
  if (!especeId) return ''
  const espece = especies.value?.[especeId]
  if (!espece) return ''
  
  // Récupérer le niveau de talent réel de la poule
  const poule = poules.value?.find(p => p.especeId === especeId)
  const niveauTalent = Math.max(1, Number(poule?.niveauTalent) || 1)
  
  return getTalentDisplayNameSync({ especeId, niveauTalent })
}

// Retourne exactement la même chaîne que ChickenDetail : utiliser getTalentEffectSync
const getTalentTooltip = (especeId) => {
  if (!especeId) return ''
  const poule = poules.value?.find(p => p.especeId === especeId) || { especeId, niveauTalent: 1 }
  // getTalentEffectSync attend un objet "poule" similaire à celui utilisé dans ChickenDetail
  return getTalentEffectSync(poule)
}

const confirmReplacement = () => {
  if (selectedIndex.value !== -1) {
    emit('replace', selectedIndex.value)
  }
}
</script>

<style scoped>
.team-replacement {
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

.current-team {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.team-member {
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

.team-member:hover {
  background: rgba(255, 249, 229, 0.2);
  transform: translateY(-1px);
}

.team-member.selected {
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.2);
}

.member-image {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 2px solid #ffc66e;
  background: #fffaf1;
}

.member-info {
  flex: 1;
}

.member-name {
  font-weight: bold;
  font-size: 16px;
}

.member-talent {
  font-size: 14px;
  color: #ffd58f;
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

.team-member.disabled {
  opacity: 0.5;
  cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;
  background: rgba(255, 249, 229, 0.05);
  border-color: #666;
}

.team-member.disabled:hover {
  background: rgba(255, 249, 229, 0.05);
  transform: none;
}

.member-image.disabled {
  filter: grayscale(100%);
}

.disabled-text {
  font-size: 11px;
  color: #ff6b6b;
  font-style: italic;
  margin-top: 2px;
}

/* Dark Mode */
.dark-mode .team-replacement {
  color: #e0e0e0 !important;
}

.dark-mode h3 {
  color: #ffb366 !important;
}

.dark-mode p {
  color: #cc9966 !important;
}

.dark-mode .team-member {
  border: 2px solid #555 !important;
  background: rgba(42, 42, 42, 0.8) !important;
}

.dark-mode .team-member:hover {
  background: rgba(64, 64, 64, 0.8) !important;
}

.dark-mode .team-member.selected {
  border-color: #ff6b6b !important;
  background: rgba(255, 107, 107, 0.2) !important;
}

.dark-mode .team-member.disabled {
  background: rgba(42, 42, 42, 0.3) !important;
}

.dark-mode .team-member.disabled:hover {
  background: rgba(42, 42, 42, 0.3) !important;
}

.dark-mode .member-image {
  border: 2px solid #555 !important;
  background: #2a2a2a !important;
}

.dark-mode .member-talent {
  color: #cc9966 !important;
}

.dark-mode .disabled-text {
  color: #ff9999 !important;
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

</style>