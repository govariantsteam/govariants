<script setup lang="ts">
import { useStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { faUserShield } from "@fortawesome/free-solid-svg-icons";

library.add(faUser, faRightToBracket, faRightFromBracket, faUserShield);
const store = useStore();
const { user } = storeToRefs(store);
store.update();
</script>

<template>
  <RouterLink class="navElement" v-if="!user" to="/login"
    ><font-awesome-icon icon="fa-solid fa-right-to-bracket" class="icon" />Log
    in</RouterLink
  >
  <template v-else>
    <RouterLink class="navElement" v-if="user.role === 'admin'" to="/admin"
      ><font-awesome-icon
        icon="fa-solid fa-user-shield"
        class="icon"
      />Admin</RouterLink
    >
    <RouterLink
      class="navElement"
      :to="{ name: 'user', params: { userId: user.id } }"
    >
      <font-awesome-icon icon="fa-solid fa-user" class="icon" />
      {{ user.username }}
    </RouterLink>
    <button
      class="navElement logoutButton"
      v-on:click="store.logout()"
      click="Log out"
    >
      <font-awesome-icon icon="fa-solid fa-right-from-bracket" class="icon" />
      Log out
    </button>
  </template>
</template>
