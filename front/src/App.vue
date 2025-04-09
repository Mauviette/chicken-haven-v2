<script setup>
import { ref, onMounted } from 'vue'

const poules = ref([])

onMounted(async () => {
  const res = await fetch('http://localhost:3001/api/poules')
  poules.value = await res.json()
})
</script>

<template>
  <h2>Liste des poules 🐔</h2>
  <ul>
    <li v-for="poule in poules" :key="poule._id">
      {{ poule.nom }} — {{ poule.effet }}
    </li>
  </ul>
</template>
