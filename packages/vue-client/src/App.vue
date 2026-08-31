<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import UserNav from "./components/UserNav.vue";
import NotificationsNav from "./components/NotificationsNav.vue";
import { ref, watchEffect } from "vue";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faBars, faBook } from "@fortawesome/free-solid-svg-icons";
import { faHouse } from "@fortawesome/free-solid-svg-icons";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import * as requests from "@/requests";
import { useCurrentUser, useStore } from "@/stores/user";
import { setNotificationsCount } from "@/stores/notifications";

library.add(faBars, faHouse, faCircleInfo, faBook);
const is_menu_closed = ref(true);

// The bell is rendered twice (see below), so the unread count is fetched here
// rather than in NotificationsNav: one request no matter how many are mounted.
const user_store = useStore();
const user = useCurrentUser();

watchEffect(async () => {
  if (user.value && user_store.csrf_token) {
    await requests
      .get("/notifications/count")
      .then((result) => setNotificationsCount(result.count))
      .catch(alert);
  }
});

const closeMenuFn = (event: MouseEvent) => {
  event.stopPropagation();
  is_menu_closed.value = true;
  document.removeEventListener("click", closeMenuFn);
};

const toggleMenuFn = (event: MouseEvent) => {
  if (is_menu_closed.value) {
    event.stopPropagation();
    is_menu_closed.value = false;
    document.addEventListener("click", closeMenuFn);
  } else {
    closeMenuFn(event);
  }
};
</script>

<template>
  <nav>
    <RouterLink class="navLogo" to="/">
      <img class="navLogoImg" src="/favicon.ico" />
    </RouterLink>
    <!--
      The bell is rendered in two places and exactly one copy is ever visible
      (see the .navBell* rules below). On mobile the nav links collapse behind
      the hamburger, so a bell inside .navContent would hide the unread badge
      until the menu is opened; it lives in the bar instead. On desktop nothing
      is collapsed, so it stays with the other nav links.
    -->
    <NotificationsNav class="navBellBar" />
    <button class="navHamburgerContainer navElement" @click="toggleMenuFn">
      <font-awesome-icon icon="fa-solid fa-bars" class="navHamburgerMenu" />
    </button>
    <div class="navContent" :class="{ closedMenu: is_menu_closed }">
      <div>
        <RouterLink class="navElement" to="/">
          <font-awesome-icon icon="fa-solid fa-house" class="icon" />
          {{ $t("home") }}
        </RouterLink>
        <RouterLink class="navElement" to="/about">
          <font-awesome-icon icon="fa-solid fa-circle-info" class="icon" />
          {{ $t("about") }}
        </RouterLink>
        <RouterLink class="navElement" to="/variants/rules-list">
          <font-awesome-icon icon="fa-solid fa-book" class="icon" />
          {{ $t("rules") }}
        </RouterLink>
        <NotificationsNav class="navBellMenu" />
      </div>
      <div>
        <UserNav />
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

  .navHamburgerContainer {
    display: none;
    .navHamburgerMenu {
      height: calc(var(--navbar-height) * 0.8);
      display: none;
    }
  }

  /* Hidden until the nav collapses; .navBellMenu is the visible copy here. */
  a.navBellBar {
    display: none;
  }

  .navContent {
    display: flex;
    justify-content: space-between;
    flex-grow: 1;

    div {
      display: flex;
    }
  }
}

@media (max-width: 768px) {
  nav {
    justify-content: space-between;

    .navHamburgerContainer {
      display: flex;
      .navHamburgerMenu {
        display: flex;
      }
    }

    /* Swap which bell is visible: the bar one, kept beside the hamburger. */
    a.navBellBar {
      display: flex;
      margin-left: auto;
    }

    a.navBellMenu {
      display: none;
    }

    .navContent {
      flex-direction: column;
      z-index: 1000;
      opacity: 1;
      position: absolute;
      top: var(--navbar-height);
      left: 0;
      background-color: var(--color-background-soft);
      box-shadow: 0px 5px 5px -5px var(--color-shadow);
      width: 100%;

      div {
        flex-direction: column;
      }

      &.closedMenu {
        display: none;
        * {
          display: none;
        }
      }
    }
  }
}
</style>
