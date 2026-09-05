<script setup lang="ts">
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { useNotificationsCount } from "@/stores/notifications";

library.add(faBell);
const notificationCount = useNotificationsCount();
</script>

<template>
  <RouterLink
    class="navElement"
    to="/notifications"
    :aria-label="`Notifications${
      notificationCount ? `, ${notificationCount} unread` : ''
    }`"
    title="Notifications"
  >
    <div class="icon-wrapper">
      <font-awesome-icon icon="fa-solid fa-bell" />
      <span v-if="notificationCount" class="badge">{{
        Math.min(notificationCount, 99)
      }}</span>
    </div>
    <span class="mobile-only">{{ $t("notifications") }}</span>
  </RouterLink>
</template>

<style scoped>
.icon-wrapper {
  position: relative;
  display: inline-block;
}

.mobile-only {
  display: none;
}

/* Mobile breakpoint - keep in sync with App.vue nav hamburger */
@media (max-width: 768px) {
  .mobile-only {
    display: inline;
  }
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
