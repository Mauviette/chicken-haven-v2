<template>
  <div class="bottom-bar">
    <div class="side-buttons left-side">
      <div class="options-button">
        <ActionButton
          :onClick="() => emit('open-options')"
        >
          <span class="desktop-text">⚙️</span>
          <span class="mobile-text">⚙️</span>
        </ActionButton>
      </div>
    </div>

    <div class="main-buttons">
      <ActionButton
        :onClick="() => emit('open-production')"
        :disabled="route.path === '/production'"
        :active="route.path === '/production'"
        class="mobile-compact"
      >
        <span class="desktop-text">⚒️ Production</span>
        <span class="mobile-text">⚒️</span>
      </ActionButton>

      <ActionButton
        :onClick="() => emit('open-market')"
        :disabled="route.path === '/market' || !isMarketUnlocked"
        :active="route.path === '/market'"
        :title="!isMarketUnlocked ? 'Débloqué au niveau 2' : ''"
        class="mobile-compact"
      >
        <span class="desktop-text">🛒 Marché</span>
        <span class="mobile-text">🛒</span>
      </ActionButton>

      <div class="badge-wrapper collection-button">
        <ActionButton
          :onClick="() => emit('open-collection')"
          :disabled="route.path === '/collection'"
          :active="route.path === '/collection'"
          class="mobile-compact"
        >
          <span class="desktop-text">🐔 Collection</span>
          <span class="mobile-text">🐔</span>
        </ActionButton>
        <span
          v-if="hasNewChicken"
          class="badge-dot badge-dot--red"
          title="Nouvelle poule dans la collection"
        ></span>
      </div>

      <ActionButton
        :onClick="() => emit('open-social')"
        :disabled="route.path === '/social'"
        :active="route.path === '/social'"
        class="mobile-compact"
      >
        <span class="desktop-text">🏆 Social</span>
        <span class="mobile-text">🏆</span>
      </ActionButton>
    </div>

    <div class="side-buttons right-side">
      <div class="achievements-button badge-wrapper">
        <ActionButton
          :onClick="() => emit('open-achievements')"
        >
          <span class="desktop-text">🏆</span>
          <span class="mobile-text">🏆</span>
        </ActionButton>
        <span
          v-if="hasUnclaimedRewards"
          class="badge-dot"
          title="Récompense de succès disponible"
        ></span>
      </div>
    </div>
  </div>
</template>
<script setup>
import ActionButton from '@/components/menu/ActionButton.vue'
import { useRoute } from 'vue-router'
import { onMounted, onUnmounted, computed } from 'vue'
import { useAchievements } from '@/composables/useAchievements'
import { usePlayer } from '@/composables/usePlayer'
import { useGameData } from '@/composables/useGameData'
import { usePoules } from '@/composables/usePoules'
const route = useRoute()

const emit = defineEmits(['open-production', 'open-market', 'open-collection', 'open-social', 'open-help', 'open-options', 'open-achievements'])

// Succès non réclamés -> badge sur le bouton
const {
  achievements,
  fetchAchievements,
  checkAchievements,
  startAutoCheck,
  stopAutoCheck
} = useAchievements()

const hasUnclaimedRewards = computed(() =>
  (achievements?.value || []).some(a => a.completed && !a.rewardClaimed)
)

onMounted(async () => {
  try {
    await fetchAchievements()
    await checkAchievements()
  } catch (_) {}
  startAutoCheck?.()
})

onUnmounted(() => {
  stopAutoCheck?.()
})

// Marché déverrouillé à partir du niveau défini dans les données centralisées
const { level } = usePlayer()
const { levelUnlocks } = useGameData()
const { poules } = usePoules()
const isMarketUnlocked = computed(() => {
  // Cherche si le marché est présent dans les unlocks du niveau courant
  // Si le joueur est au niveau N, on considère qu'il a déjà franchi les niveaux < = N
  // Donc marché est dispo si présent dans levelUnlocks[n] pour n <= level
  const l = level.value || 1
  for (let n = 1; n <= l; n++) {
    const arr = (levelUnlocks?.value && levelUnlocks.value[n]) ? levelUnlocks.value[n] : []
    if (arr.some(u => u.id === 'market')) return true
  }
  return false
})

// Badge rouge sur Collection si nouvelle poule
const hasNewChicken = computed(() => (poules?.value || []).some(p => !!p.new))
</script>

  <style scoped>
  .bottom-bar {
    width: 100%;
    height: 80px;
    min-height: 80px;
    max-height: 80px;
    background-color: #421d00;
    background-image: url('@/assets/bar/bg.png');
    background-repeat: repeat;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    box-sizing: border-box;
    box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    border-top: 4px solid #b77b3d;
    box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.25);
    flex-shrink: 0;
    z-index: 10;
  }

  /* Cacher la BottomBar sur mobile */
  @media (max-width: 768px) {
    .bottom-bar {
      display: none;
    }
  }

  .main-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex: 1;
  }

  .side-buttons {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .left-side {
    margin-left: 0;
  }

  .right-side {
    margin-right: 0;
  }

  .options-button {
    margin-left: 0;
  }

  .achievements-button {
    margin-right: 0;
  }

  /* Badge de notification pour succès à réclamer */
  .badge-wrapper {
    position: relative;
    display: inline-block;
  }

  .badge-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    background-color: #FFD700; /* or */
    border: 2px solid #8B4513;
    border-radius: 50%;
    box-shadow: 0 0 6px rgba(255, 215, 0, 0.8);
    pointer-events: none;
    z-index: 2;
  }

  .badge-dot--red {
    background-color: #e53935;
    box-shadow: 0 0 6px rgba(229, 57, 53, 0.8);
    border-color: #8B0000;
  }

  .bottom-bar button {
    background-color: #7a3e10;
    border: 2px solid #ffc66e;
    color: #fff9e5;
    border-radius: 10px;
    padding: 8px 12px;
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;

    transition: transform 0.1s ease;
  }

  .bottom-bar button:hover {
    background-color: #8a4a1c;
    transform: translateY(-1px);
  }

  /* Gestion du texte responsive */
  .mobile-text {
    display: none;
  }

  .desktop-text {
    display: inline;
  }

  /* Media queries pour mobile */
  @media (max-width: 768px) {
    .bottom-bar {
      height: 70px;
      min-height: 70px;
      max-height: 70px;
      padding: 4px 8px;
      position: fixed;
      bottom: 0;
    }

    .main-buttons {
      gap: 8px;
      flex: 1;
      justify-content: space-evenly;
    }

    .side-buttons {
      flex-shrink: 0;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      padding: 4px;
    }

    .left-side {
      margin-left: 0;
    }

    .right-side {
      margin-right: 0;
    }

    .bottom-bar .action-button {
      font-size: 12px;
      padding: 6px 8px;
      white-space: nowrap;
      min-width: auto;
    }

    /* Réduire la taille des textes sur très petits écrans */
    @media (max-width: 480px) {
      .mobile-text {
        display: inline;
      }

      .desktop-text {
        display: none;
      }

      .side-buttons .action-button {
        font-size: 18px;
        padding: 10px;
        border-radius: 50%;
        min-width: 44px;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .bottom-bar .action-button {
        font-size: 16px;
        padding: 8px 12px;
        min-width: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .bottom-bar {
        height: 60px;
        min-height: 60px;
        max-height: 60px;
        padding: 2px 4px;
      }

      .main-buttons {
        gap: 6px;
      }

      .side-buttons {
        background: rgba(139, 69, 19, 0.3);
        border: 1px solid rgba(255, 198, 110, 0.5);
      }
    }
  }

  @media (max-width: 600px) {
    .bottom-bar {
      height: 80px;
      min-height: 80px;
      max-height: 80px;
      padding: 8px 12px;
      gap: 4px;
    }

    .main-buttons {
      gap: 4px;
      flex: 1;
    }

    .left-side {
      margin-left: 0;
    }

    .right-side {
      margin-right: 0;
    }

    .bottom-bar .action-button {
      font-size: 13px;
      padding: 6px 10px;
    }
  }

  </style>
