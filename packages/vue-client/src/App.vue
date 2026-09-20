<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { storeToRefs } from "pinia";
import { useStore } from "@/stores/user";
import NavItems from "./components/NavItems.vue";
import NavMenu from "./components/NavMenu.vue";
import UserNav from "./components/UserNav.vue";
import NotificationsNav from "./components/NotificationsNav.vue";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";

library.add(faRightToBracket);

const store = useStore();
const { user } = storeToRefs(store);
store.update();
</script>

<template>
  <nav>
    <RouterLink class="navLogo" to="/">
      <img class="navLogoImg" src="/favicon.ico" />
    </RouterLink>
    <NotificationsNav class="navNotificationsMobile" />
    <NavMenu class="navMobile" />
    <div class="navDesktop">
      <div class="navGroup">
        <NavItems />
        <NotificationsNav />
      </div>
      <div class="navGroup">
        <UserNav v-if="user" :user="user" />
        <RouterLink v-else class="navElement" to="/login">
          <font-awesome-icon icon="fa-solid fa-right-to-bracket" class="icon" />
          {{ $t("login") }}
        </RouterLink>
      </div>
    </div>
  </nav>
  <Suspense><RouterView /></Suspense>
</template>

<style scoped>
nav {
  width: 100%;
  height: var(--navbar-height);
  text-align: left;
  font-size: 1rem;
  position: sticky;
  top: 0;
  z-index: 999;
  background-color: var(--color-background-soft);
  display: flex;
  justify-content: flex-start;
  align-items: center;
  box-shadow: 0px 0px 5px var(--color-shadow);
  margin-bottom: 5px;

  .navLogoImg {
    width: calc(var(--navbar-height) * 0.8);
    height: calc(var(--navbar-height) * 0.8);
  }

  a.navNotificationsMobile {
    display: none;
  }

  .navMobile {
    display: none;
  }

  .navDesktop {
    display: flex;
    justify-content: space-between;
    flex-grow: 1;
  }

  .navGroup {
    display: flex;
  }
}

@media (max-width: 768px) {
  nav {
    justify-content: space-between;

    a.navNotificationsMobile {
      display: flex;
      margin-left: auto;
      font-size: calc(var(--navbar-height) * 0.56);
    }

    a.navNotificationsMobile :deep(.icon-wrapper) {
      display: flex;
    }

    a.navNotificationsMobile :deep(.badge) {
      top: -22%;
      right: -32%;
      font-size: 0.45em;
      padding: 0.2em 0.4em 0.3em 0.4em;
    }

    .navMobile {
      display: flex;
    }

    .navDesktop {
      display: none;
    }
  }
}
</style>
