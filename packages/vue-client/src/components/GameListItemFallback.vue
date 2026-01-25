<script setup lang="ts">
const props = defineProps<{ variant: string; gameId: string; error: string }>();
</script>

<template>
  <li class="game-list-item">
    <RouterLink :to="{ name: 'game', params: { gameId: props.gameId } }">
      <div class="error">{{ error }}</div>
      <div class="variant-text">{{ props.variant }}</div>
    </RouterLink>
  </li>
</template>

<style scoped>
li.game-list-item {
  padding: 10px;
  width: 50%;
  list-style-type: none;
  display: inline-block;
}

.error {
  color: red;
  font-family: monospace;
}

.variant-text {
  font-variant: small-caps;
  color: gray;
  text-align: right;
  padding: 0;
  margin-top: -15px;
}

a {
  text-decoration: none;
}
</style>
