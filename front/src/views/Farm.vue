<template>
  <div class="farm-screen">
    <TopBar :eggs="eggs" @open-profile="openProfileMenu" />

    <FarmGrid :gridSize="14" @chicken-click="eggs++" />

    <BottomBar
      :hasHatchery="true"
      @open-market="openMarket"
      @open-collection="openCollection"
      @open-hatchery="openHatchery"
      @open-options="showOptions = true"
      @open-help="openHelp"
      @logout="handleLogout"
    />

    <Popup v-if="showOptions && isLoaded" @close="showOptions = false">
      <h2>⚙️ Options</h2>
      <label class="option-line">
        <input type="checkbox" v-model="settings.sound" />
        Activer le son 🔈
      </label>
    </Popup>

  </div>
</template>

<script setup>
import { useSettings } from '@/composables/useSettings'
import { ref, onMounted } from 'vue'
import FarmGrid from '@/components/farm/FarmGrid.vue'
import ActionButton from '@/components/menu/ActionButton.vue'
import BottomBar from '@/components/menu/BottomBar.vue'
import TopBar from '@/components/menu/TopBar.vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Popup from '@/components/menu/Popup.vue'



const { settings, fetchSettings, isLoaded } = useSettings()
const eggs = ref(0)
const isCollecting = ref(false)
const router = useRouter()
const { logout } = useAuth()
const showOptions = ref(false)

onMounted(() => {
  fetchSettings()
})

function handleLogout() {
  logout()
  router.push('/auth')
}

function openMarket() {
  window.$toast("Bientôt disponible !", 'info')
}

function openCollection() {
  window.$toast("Bientôt disponible !", 'info')
}

function openHatchery() {
  window.$toast("Bientôt disponible !", 'info')
}

function openHelp() {
  window.$toast("Bientôt disponible !", 'info')
}

function openProfileMenu() {
  window.$toast("Bientôt disponible !", 'info')
  // À remplacer plus tard par une modale ou un menu déroulant
}
</script>

<style scoped>
.farm-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  overflow: hidden;

}
.farm-container {
  position: relative;
}

.button-bottom-right {
  position: absolute;
  bottom: 20px;
  right: 20px;
}
.option-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Fredoka', sans-serif;
  color: #fff9e5;
  margin-top: 12px;
  font-size: 16px;
}
</style>
