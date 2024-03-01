<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import UserNav from "./components/UserNav.vue";
import { ref } from "vue";

const is_menu_closed = ref(true);

const closeMenuFn = (event: MouseEvent) => {
  event.stopPropagation();
  is_menu_closed.value = true;
  document.removeEventListener("click", closeMenuFn);
};

const openMenuFn = (event: MouseEvent) => {
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
    <button class="navElement navHamburgerMenuButton" @click="openMenuFn">
      Menu
    </button>
    <div class="navContent" v-bind:class="{ closedMenu: is_menu_closed }">
      <div>
        <RouterLink class="navElement" to="/">Home</RouterLink>
        <RouterLink class="navElement" to="/about">About</RouterLink>
      </div>
      <div>
        <UserNav />
      </div>
    </div>
  </nav>
  <div class="pageWrapper">
    <Suspense><RouterView /></Suspense>
  </div>
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
  justify-content: start;
  box-shadow: 0px 0px 5px var(--color-shadow);
  margin-bottom: 5px;

  .navContent {
    display: flex;
    justify-content: space-between;
    flex-grow: 1;

    div {
      display: flex;
    }
  }

  .navLogoImg {
    width: calc(var(--navbar-height) * 0.8);
    height: calc(var(--navbar-height) * 0.8);
  }
}

.navHamburgerMenuButton {
  display: none;
}

@media (max-width: 768px) {
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
  }

  .navHamburgerMenuButton {
    display: flex;
  }

  .closedMenu {
    display: none;
    * {
      display: none !important;
    }
  }
}
</style>
