<script setup lang="ts">
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { watchEffect } from "vue";
import * as requests from "@/requests";
import { useCurrentUser, useStore } from "@/stores/user";
import {
  setNotificationsCount,
  useNotificationsCount,
} from "@/stores/notifications";

library.add(faBell);
const notificationCount = useNotificationsCount();
const store = useStore();
const user = useCurrentUser();

watchEffect(async () => {
  if (user.value && store.csrf_token) {
    await requests
      .get("/notifications/count")
      .then((result) => setNotificationsCount(result.count))
      .catch(alert);
  }
});
</script>

<template>
  <RouterLink class="navElement" to="/notifications">
    <v-badge
      v-if="notificationCount !== null && notificationCount > 0"
      location="top right"
      color="error"
      :content="notificationCount"
    >
      <font-awesome-icon icon="fa-solid fa-bell" />
    </v-badge>
    <font-awesome-icon v-else icon="fa-solid fa-bell" />
  </RouterLink>
</template>

<style scoped>
::v-deep(.v-badge__badge) {
  transform: scale(0.7);
}
</style>
