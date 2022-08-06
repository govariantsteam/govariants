<script setup lang="ts">
  import { useStore } from "@/stores/user";
  import { storeToRefs } from "pinia";
  const store = useStore();
  const { user } = storeToRefs(store);
  store.update();
</script>

<template>
  <input
    v-if="!user"
    type="button"
    v-on:click="store.guestLogin()"
    value="Remember me"
  />
  <input v-else type="button" v-on:click="store.logout()" value="Forget me" />
</template>
