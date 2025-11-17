<script setup lang="ts">
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { ref, watchEffect } from "vue";
import * as requests from "@/requests";
import { useCurrentUser, useStore } from "@/stores/user";

library.add(faBell);
const notificationCount = ref(null);
const store = useStore();
const user = useCurrentUser();

watchEffect(async () => {
  if (user.value && store.csrf_token) {
    await requests
      .get("/notifications/count")
      .then((result) => (notificationCount.value = result.count))
      .catch(alert);
  } else {
    notificationCount.value = null;
  }
});
</script>

<template>
  <RouterLink class="navElement" to="/notifications">
    <v-badge
      v-if="notificationCount !== null"
      location="top right"
      color="error"
      :content="notificationCount"
    >
      <font-awesome-icon icon="fa-solid fa-bell" class="icon" />
    </v-badge>
    <font-awesome-icon v-else icon="fa-solid fa-bell" class="icon" />
  </RouterLink>
</template>

<style scoped>
::v-deep(.v-badge__badge) {
  transform: scale(0.7);
}
</style>
