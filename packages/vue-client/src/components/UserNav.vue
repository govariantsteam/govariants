<script setup lang="ts">
import { useStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { faArrowRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";

library.add(faUser, faArrowRightToBracket, faArrowRightFromBracket);
const store = useStore();
const { user } = storeToRefs(store);
store.update();
</script>

<template>
  <RouterLink class="navElement" v-if="!user" to="/login"
    ><font-awesome-icon
      icon="fa-solid fa-arrow-right-to-bracket"
      class="icon"
    />Log in</RouterLink
  >
  <template v-else>
    <!-- TODO: make this a link to the user's profile? -->
    <RouterLink class="navElement" to="/"
      ><font-awesome-icon icon="fa-solid fa-user" class="icon" />{{
        user.username
      }}</RouterLink
    >
    <button
      class="navElement logoutButton"
      v-on:click="store.logout()"
      click="Log out"
    >
      <font-awesome-icon
        icon="fa-solid fa-arrow-right-from-bracket"
        class="icon"
      />
      Log out
    </button>
  </template>
</template>
