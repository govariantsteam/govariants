import { defineStore, storeToRefs } from "pinia";
import { Ref } from "vue";

type NotificationsStoreState = {
  unreadCount: number | null;
};

const notificationStore = defineStore("notifications", {
  state: (): NotificationsStoreState => ({ unreadCount: null }),
  actions: {
    set(count: number): void {
      this.unreadCount = count;
    },
  },
});

export function useNotificationsCount(): Ref<number | null> {
  return storeToRefs(notificationStore()).unreadCount;
}

export function setNotificationsCount(count: number): void {
  notificationStore().set(count);
}
