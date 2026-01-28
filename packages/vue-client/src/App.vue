<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import UserNav from "./components/UserNav.vue";
import NotificationsNav from "./components/NotificationsNav.vue";
import { ref } from "vue";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faBars, faBook } from "@fortawesome/free-solid-svg-icons";
import { faHouse } from "@fortawesome/free-solid-svg-icons";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

library.add(faBars, faHouse, faCircleInfo, faBook);
const is_menu_closed = ref(true);

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
    <RouterLink class="navLogo" to="/"
      ><img class="navLogoImg" src="/favicon.ico"
    /></RouterLink>
    <button class="navHamburgerContainer navElement" @click="toggleMenuFn">
      <font-awesome-icon icon="fa-solid fa-bars" class="navHamburgerMenu" />
    </button>
    <div class="navContent" v-bind:class="{ closedMenu: is_menu_closed }">
      <div>
        <RouterLink class="navElement" to="/"
          ><font-awesome-icon
            icon="fa-solid fa-house"
            class="icon"
          />Home</RouterLink
        >
        <RouterLink class="navElement" to="/about"
          ><font-awesome-icon
            icon="fa-solid fa-circle-info"
            class="icon"
          />About</RouterLink
        >
        <RouterLink class="navElement" to="/variants/rules-list"
          ><font-awesome-icon
            icon="fa-solid fa-book"
            class="icon"
          />Rules</RouterLink
        >
        <NotificationsNav />
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
