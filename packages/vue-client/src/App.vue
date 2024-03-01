<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import UserNav from "./components/UserNav.vue";
</script>

<template>
  <nav>
    <RouterLink class="navLogo" to="/"
      ><img class="navLogoImg" src="/favicon.ico"
    /></RouterLink>
    <button class="navElement navHamburgerMenuButton">Menu</button>
    <div class="navContent" v-bind:class="{ closedMenu: false }">
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
    width: calc(var(--navbar-height) * 0.85);
    height: calc(var(--navbar-height) * 0.85);
  }
}

.navHamburgerMenuButton {
  display: none;
}

header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
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
    width: 100vw;

    div {
      flex-direction: column;
    }
  }

  .navHamburgerMenuButton {
    display: flex;
  }

  .closedMenu {
    opacity: 0;
    height: 0;
  }
}
</style>
