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
    <div class="icon-wrapper">
      <font-awesome-icon icon="fa-solid fa-bell" />
      <span v-if="notificationCount" class="badge">{{
        Math.min(notificationCount, 99)
      }}</span>
    </div>
  </RouterLink>
</template>

<style scoped>
.icon-wrapper {
  position: relative;
  display: inline-block;
}

.badge {
  position: absolute;
  top: -4px;
  right: -15px;
  background: red;
  color: white;
  font-size: 10px;
  padding: 2px 4px 3px 4px;
  border-radius: 999px;
  line-height: 1;
}
</style>
