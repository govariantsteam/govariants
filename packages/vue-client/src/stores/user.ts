import { defineStore, storeToRefs } from "pinia";
import * as requests from "../requests";
import type { User } from "@ogfcommunity/variants-shared";
import type { Ref } from "vue";

interface UserStoreStateTree {
  user: User | null;
}

export const useStore = defineStore("user", {
  state: (): UserStoreStateTree => {
    return { user: null };
  },
  actions: {
    async update() {
      this.user = await requests.get("/checkLogin");
      console.log(this.user);
    },

    async guestLogin() {
      this.user = await requests.get("/guestLogin");
      this.update();
    },

    async logout() {
      await requests.get("/logout");
      this.user = null;
      this.update();
    },
  },
});

export function useCurrentUser(): Ref<User | null> {
  const store = useStore();
  return storeToRefs(store).user;
}
