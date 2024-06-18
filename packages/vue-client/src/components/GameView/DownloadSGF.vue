<script setup lang="ts">
const props = defineProps<{ gameId?: string }>();
</script>

<template>
  <a :href="`/api/game/${props.gameId}/sgf`">Download Game Files</a>
</template>
