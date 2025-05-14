<template>
  <TopBar v-if="!isAuthPage" />
  <router-view />
  <ToastManager ref="toastManager" />
  <Options :visible="showOptions" @close="showOptions = false" />
  <BottomBar
    v-if="!isAuthPage"
    @open-production="router.push('/production')"
    @open-market="toast('Bientôt disponible !')"
    @open-collection="toast('Bientôt disponible !')"
    @open-help="toast('Bientôt disponible !')"
  />

</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToastManager from '@/components/menu/ToastManager.vue'
import Options from '@/components/menu/Options.vue'
import BottomBar from '@/components/menu/BottomBar.vue'
import TopBar from '@/components/menu/TopBar.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const toastManager = ref(null)
const showOptions = ref(false)

function toast(message, type = 'info') {
  if (toastManager.value?.showToast) {
    toastManager.value.showToast(message, type)
  } else {
    console.warn('Toast system not ready:', message)
  }
}

const route = useRoute()

// Vérifie si la route actuelle est la page de connexion
const isAuthPage = computed(() => route.name === 'Auth')
</script>

<style>
body {
  user-select: none;
  margin: 0;
  overflow: hidden;
  cursor: url('@/assets/ui/cursor/hand_small_point.png') 16 16, auto;
}

a, button, input[type="button"], input[type="submit"], input[type="checkbox"] select, textarea, .pointer {
  cursor: url('@/assets/ui/cursor/hand_small_point_n.png') 16 16, auto;
}

img,
.fence,
.tile,
.fog,
.chicken {
  image-rendering: pixelated;
}

</style>
