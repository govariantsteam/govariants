<script setup lang="ts">
import { useStore } from "@/stores/user";
import { storeToRefs } from "pinia";
const store = useStore();
const { user } = storeToRefs(store);
store.update();
</script>

<template>
  <RouterLink class="navElement" v-if="!user" to="/login">Log in</RouterLink>
  <template v-else>
    <!-- TODO: make this a link to the user's profile? -->
    <RouterLink class="navElement" to="/">{{ user.username }}</RouterLink>
    <button class="navElement" v-on:click="store.logout()" click="Log out">
      Log out
    </button>
  </template>
</template>
