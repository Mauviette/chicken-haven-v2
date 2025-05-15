<template>
  <div class="farm-screen">
    <TopBar :eggs="eggs" @open-profile="openProfileMenu" />


    <FarmGrid @chicken-click="eggs++" class="farm-visual"/>

    <BottomBar
      :hasHatchery="true"
      @open-market="openMarket"
      @open-collection="openCollection"
      @open-hatchery="openHatchery"
      @open-options="optionsModal?.openOptions()"
      @open-help="openHelp"
      @logout="handleLogout"
    />

    <Options ref="optionsModal" />

  </div>
</template>

<script setup>
import { useSettings } from '@/composables/useSettings'
import { ref, onMounted } from 'vue'
import FarmGrid from '@/components/unused/farm/FarmGrid.vue'
import BottomBar from '@/components/menu/BottomBar.vue'
import TopBar from '@/components/menu/TopBar.vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Options from '@/components/menu/Options.vue'


const { fetchSettings } = useSettings()
const eggs = ref(0)
const router = useRouter()
const { logout } = useAuth()
const optionsModal = ref(null)

onMounted(() => {
  fetchSettings()
})

function handleLogout() {
  logout()
  router.push('/auth')
}

function openMarket() {
  toast("Bientôt disponible !", 'info')
}

function openCollection() {
  toast("Bientôt disponible !", 'info')
}

function openHatchery() {
  toast("Bientôt disponible !", 'info')
}

function openHelp() {
  toast("Bientôt disponible !", 'info')
}

function openProfileMenu() {
  toast("Bientôt disponible !", 'info')
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


</style>
