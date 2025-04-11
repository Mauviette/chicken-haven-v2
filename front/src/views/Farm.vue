<template>
  <div class="farm-screen">
    <TopBar :eggs="eggs" @open-profile="openProfileMenu" />


    <FarmGrid :gridSize="14" @chicken-click="eggs++" />

    <BottomBar
      :hasHatchery="true"
      @open-market="openMarket"
      @open-collection="openCollection"
      @open-hatchery="openHatchery"
      @open-options="openOptions"
      @open-help="openHelp"
    />


  </div>
</template>

<script setup>
import { ref } from 'vue'
import FarmGrid from '@/components/farm/FarmGrid.vue'
import ActionButton from '@/components/menu/ActionButton.vue'
import BottomBar from '@/components/menu/BottomBar.vue'
import TopBar from '@/components/menu/TopBar.vue'

function openMarket() {
  console.log("🏪 Market ouvert")
}

function openCollection() {
  console.log("📦 Collection ouverte")
}

function openHatchery() {
  console.log("🐣 Couvoir ouvert")
}

function openOptions() {
  console.log("⚙️ Options ouvertes")
}

function openHelp() {
  console.log("❓ Aide ouverte")
}

const eggs = ref(0)
const isCollecting = ref(false)

function collectEggs() {
  isCollecting.value = true
  console.log("🧺 Œufs collectés !")

  // Simuler un temps de collecte
  setTimeout(() => {
    isCollecting.value = false
  }, 1000)
}

function openProfileMenu() {
  console.log("🧑‍🌾 Menu profil ouvert !");
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
