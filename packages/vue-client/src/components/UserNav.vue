<script setup lang="ts">
import { useStore } from "@/stores/user";
import { storeToRefs } from "pinia";
const store = useStore();
const { user } = storeToRefs(store);
store.update();
</script>

<template>
  <RouterLink v-if="!user" to="/login">Log in</RouterLink>
  <template v-else>
    <!-- TODO: make this a link to the user's profile? -->
    <RouterLink to="#">{{ user.username }}</RouterLink>
    <input type="button" v-on:click="store.logout()" value="Log out" />
  </template>
</template>

<style scoped>
nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
  color: var(--color-text);
}
</style>
