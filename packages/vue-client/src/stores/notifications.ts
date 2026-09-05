import { defineStore, storeToRefs } from "pinia";
import { onScopeDispose, ref, watchEffect } from "vue";
import type { Ref } from "vue";
import { NOTIFICATIONS_COUNT_EVENT } from "@govariants/shared";
import * as requests from "../requests";
import { useStore as useUserStore } from "./user";

const notificationStore = defineStore("notifications", () => {
  const unreadCount: Ref<number | null> = ref(null);
  const userStore = useUserStore();

  function set(count: number): void {
    unreadCount.value = count;
  }

  // The fetch only covers the count at page load; the server pushes every later
  // change to this user's own room.
  watchEffect(async () => {
    if (userStore.user && userStore.csrf_token) {
      await requests
        .get("/notifications/count")
        .then((result) => set(result.count))
        .catch(alert);
    } else {
      unreadCount.value = null;
    }
  });

  requests.socket.on(NOTIFICATIONS_COUNT_EVENT, set);
  onScopeDispose(() => {
    requests.socket.off(NOTIFICATIONS_COUNT_EVENT, set);
  });

  return { unreadCount, set };
});

export function useNotificationsCount(): Ref<number | null> {
  return storeToRefs(notificationStore()).unreadCount;
}

export function setNotificationsCount(count: number): void {
  notificationStore().set(count);
}
