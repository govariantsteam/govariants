<script setup lang="ts">
defineProps<{ nextToPlay?: number[] }>();
</script>

<template>
  <div v-if="nextToPlay?.length" class="players-to-move-container">
    <div v-if="nextToPlay?.length === 1" class="info-label">
      Player {{ nextToPlay[0] }} to move
    </div>
    <div v-else>
      <span class="info-label">Players to move:</span>
      <ul>
        <li v-for="value in nextToPlay" :key="value">Player {{ value }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.players-to-move-container {
  margin: 5px 0;
}

.players-to-move-container ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
