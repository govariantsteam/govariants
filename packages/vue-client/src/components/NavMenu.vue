<script setup lang="ts">
import { useCurrentUser } from "@/stores/user";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { useDismissableMenu } from "@/utils/dismissable_menu";
import NavItems from "./NavItems.vue";
import UserNavItems from "./UserNavItems.vue";

library.add(faBars, faRightToBracket);

const user = useCurrentUser();
const { isOpen, toggle } = useDismissableMenu();
</script>

<template>
  <div class="navMenu">
    <button
      class="navElement navHamburgerContainer"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <font-awesome-icon icon="fa-solid fa-bars" class="navHamburgerMenu" />
    </button>
    <div v-if="isOpen" class="navMenuDropdown">
      <NavItems />
      <template v-if="user">
        <div class="userName">{{ user.username }}</div>
        <UserNavItems :user="user" />
      </template>
      <RouterLink v-else class="navElement" to="/login">
        <font-awesome-icon icon="fa-solid fa-right-to-bracket" class="icon" />
        {{ $t("login") }}
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.navMenu {
  display: flex;
  position: static;
}

.navHamburgerMenu {
  height: calc(var(--navbar-height) * 0.8);
}

.navMenuDropdown {
  position: absolute;
  top: var(--navbar-height);
  left: 0;
  z-index: 1000;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-soft);
  box-shadow: 0px 5px 5px -5px var(--color-shadow);
}

.userName {
  padding: 0.6rem 1.2rem 0.2rem;
  font-weight: bold;
  opacity: 0.7;
}
</style>
