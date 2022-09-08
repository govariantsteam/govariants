import { defineStore } from "pinia";
import * as requests from "../requests";

export const useStore = defineStore("user", {
  state: () => {
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
