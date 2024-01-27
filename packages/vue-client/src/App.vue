<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import UserNav from "./components/UserNav.vue";
</script>

<template>
  <nav>
    <div>
      <RouterLink class="navElement" to="/"
        ><img class="navLogo" src="/favicon.ico"
      /></RouterLink>
      <RouterLink class="navElement" to="/about">About</RouterLink>
    </div>
    <UserNav />
  </nav>
  <div class="pageWrapper">
    <Suspense><RouterView /></Suspense>
  </div>
</template>

<style scoped>
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
</style>
