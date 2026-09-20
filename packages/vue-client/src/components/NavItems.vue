<script setup lang="ts">
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import { faHouse } from "@fortawesome/free-solid-svg-icons";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

library.add(faHouse, faCircleInfo, faBook);
</script>

<template>
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
</template>
