<script setup lang="ts">
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import type { UserResponse } from "@govariants/shared";
import { useDismissableMenu } from "@/utils/dismissable_menu";
import UserNavItems from "./UserNavItems.vue";

library.add(faUser, faChevronDown);

defineProps<{ user: UserResponse }>();

const { isOpen, toggle } = useDismissableMenu();
</script>

<template>
  <div class="userNav">
    <button
      class="navElement userNavButton"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <font-awesome-icon icon="fa-solid fa-user" class="icon" />
      {{ user.username }}
      <font-awesome-icon
        icon="fa-solid fa-chevron-down"
        class="caret"
        :class="{ caretOpen: isOpen }"
      />
    </button>
    <div v-if="isOpen" class="userNavDropdown">
      <UserNavItems :user="user" />
    </div>
  </div>
</template>

<style scoped>
.userNav {
  position: relative;
}

.userNavButton {
  gap: 0.5rem;
}

.caret {
  font-size: 0.7em;
  transition: transform 0.2s;
}

.caretOpen {
  transform: rotate(180deg);
}

.userNavDropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1001;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow: 0px 5px 5px -5px var(--color-shadow);
}
</style>
