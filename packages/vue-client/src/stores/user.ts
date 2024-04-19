import { defineStore, storeToRefs } from "pinia";
import * as requests from "../requests";
import type { User } from "@/../../shared/src";
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
    },

    async guestLogin() {
      this.user = await requests.get("/guestLogin");
      this.update();
    },

    async registerUser(username: string, password: string) {
      this.user = await requests.post("/register", {
        username,
        password,
      });
      this.update();
    },

    async userLogin(username: string, password: string) {
      this.user = await requests.post("/login", {
        username,
        password,
      });
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
