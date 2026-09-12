<script setup lang="ts">
import { useRouter } from "vue-router";
import { useStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { faUserShield } from "@fortawesome/free-solid-svg-icons";

library.add(faUser, faRightToBracket, faRightFromBracket, faGear, faUserShield);
const store = useStore();
const { user } = storeToRefs(store);
store.update();

const router = useRouter();

async function logout(): Promise<void> {
  await store.logout();
  router.push("/");
}
</script>

<template>
  <div>
    <RouterLink v-if="!user" class="navElement" to="/login"
      ><font-awesome-icon icon="fa-solid fa-right-to-bracket" class="icon" />{{
        $t("login")
      }}</RouterLink
    >
    <template v-else>
      <div class="userName">{{ user.username }}</div>
      <RouterLink
        class="navElement"
        :to="{ name: 'user', params: { userId: user.id } }"
      >
        <font-awesome-icon icon="fa-solid fa-user" class="icon" />
        {{ $t("profile") }}
      </RouterLink>
      <RouterLink class="navElement" to="/settings">
        <font-awesome-icon icon="fa-solid fa-gear" class="icon" />
        {{ $t("settings") }}
      </RouterLink>
      <RouterLink v-if="user.role === 'admin'" class="navElement" to="/admin">
        <font-awesome-icon icon="fa-solid fa-user-shield" class="icon" />
        {{ $t("admin") }}
      </RouterLink>
      <button class="navElement logoutButton" @click="logout">
        <font-awesome-icon icon="fa-solid fa-right-from-bracket" class="icon" />
        {{ $t("logout") }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.userName {
  padding: 0.6rem 1.2rem 0.2rem;
  font-weight: bold;
  opacity: 0.7;
}
</style>
