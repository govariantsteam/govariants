

<script setup lang="ts">


const props = defineProps<{ gameId?: string}>();

</script>

<template>
  <a :href="`/game/${props.gameId}/sgf`">Download Game Files</a>
</template>
  
  <style scoped>
  button {
    margin-top: 10px;
  }
  </style>
  