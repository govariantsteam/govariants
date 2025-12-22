import { defineStore, storeToRefs } from "pinia";
import * as requests from "../requests";
import type { UserResponse } from "@ogfcommunity/variants-shared";
import type { Ref } from "vue";

interface UserStoreStateTree {
  user: UserResponse | null;
  csrf_token: string | null;
}

export const useStore = defineStore("user", {
  state: (): UserStoreStateTree => {
    return { user: null, csrf_token: null };
  },
  actions: {
    async update() {
      const res = await requests.get("/checkLogin");
      this.user = res.user;
      this.csrf_token = res.csrf_token;
    },

    async guestLogin() {
      this.user = await requests.get("/guestLogin");
      this.update();
    },

    async registerUser(username: string, password: string, email?: string) {
      this.user = await requests.post("/register", {
        username,
        password,
        ...(email && { email }),
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
      this.csrf_token = null;
      this.update();
    },
  },
});

export function useCurrentUser(): Ref<UserResponse | null> {
  const store = useStore();
  return storeToRefs(store).user;
}
