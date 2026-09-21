<script setup lang="ts">
import { useRouter } from "vue-router";
import { isGuest, useStore } from "@/stores/user";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { faUserShield } from "@fortawesome/free-solid-svg-icons";
import type { UserResponse } from "@govariants/shared";

library.add(faUser, faRightFromBracket, faUserShield);

defineProps<{ user: UserResponse }>();

const store = useStore();
const router = useRouter();

async function logout(): Promise<void> {
  await store.logout();
  router.push("/");
}
</script>

<template>
  <RouterLink
    v-if="!isGuest(user)"
    class="navElement"
    :to="{ name: 'user', params: { userId: user.id } }"
  >
    <font-awesome-icon icon="fa-solid fa-user" class="icon" />
    {{ $t("profile") }}
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
