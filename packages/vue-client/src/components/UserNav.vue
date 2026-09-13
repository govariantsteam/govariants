<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { faUserShield } from "@fortawesome/free-solid-svg-icons";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

library.add(
  faUser,
  faRightToBracket,
  faRightFromBracket,
  faGear,
  faUserShield,
  faChevronDown,
);
const store = useStore();
const { user } = storeToRefs(store);
store.update();

const router = useRouter();
const isOpen = ref(false);

function close() {
  isOpen.value = false;
  document.removeEventListener("click", close);
  document.removeEventListener("keydown", onKeydown);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    close();
  }
}

function toggle(event: MouseEvent) {
  if (isOpen.value) {
    close();
    return;
  }
  // Clicks on the items are left to bubble so that the listener below closes
  // the menu behind them, which means this one has to be held back.
  event.stopPropagation();
  isOpen.value = true;
  document.addEventListener("click", close);
  document.addEventListener("keydown", onKeydown);
}

onBeforeUnmount(close);

async function logout(): Promise<void> {
  await store.logout();
  router.push("/");
}
</script>

<template>
  <div>
    <RouterLink v-if="!user" class="navElement" to="/login"
      ><font-awesome-icon icon="fa-solid fa-right-to-bracket" class="icon" />{{
        $t("login")
      }}</RouterLink
    >
    <div v-else class="userMenu">
      <button
        class="navElement userMenuButton"
        aria-haspopup="menu"
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
      <div v-if="isOpen" class="userMenuDropdown" role="menu">
        <RouterLink
          class="userMenuItem"
          role="menuitem"
          :to="{ name: 'user', params: { userId: user.id } }"
        >
          <font-awesome-icon icon="fa-solid fa-user" class="icon" />
          {{ $t("profile") }}
        </RouterLink>
        <RouterLink class="userMenuItem" role="menuitem" to="/settings">
          <font-awesome-icon icon="fa-solid fa-gear" class="icon" />
          {{ $t("settings") }}
        </RouterLink>
        <RouterLink
          v-if="user.role === 'admin'"
          class="userMenuItem"
          role="menuitem"
          to="/admin"
        >
          <font-awesome-icon icon="fa-solid fa-user-shield" class="icon" />
          {{ $t("admin") }}
        </RouterLink>
        <button
          class="userMenuItem logoutItem"
          role="menuitem"
          @click="logout"
        >
          <font-awesome-icon
            icon="fa-solid fa-right-from-bracket"
            class="icon"
          />
          {{ $t("logout") }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.userMenu {
  position: relative;
}

.userMenuButton {
  display: flex;
  align-items: center;
  gap: 0.4em;
}

.caret {
  font-size: 0.7em;
  transition: transform 0.2s;
}

.caretOpen {
  transform: rotate(180deg);
}

.userMenuDropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1001;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  padding: 0.25em;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow: 0px 5px 5px -5px var(--color-shadow);
}

.userMenuItem {
  display: flex;
  align-items: center;
  gap: 0.6em;
  padding: 0.6em 0.8em;
  border: none;
  border-radius: 4px;
  background: none;
  color: var(--color-text);
  font: inherit;
  text-align: left;
  text-decoration: none;
  text-wrap: nowrap;
  cursor: pointer;

  &:hover {
    transition: 0.4s;
    background-color: var(--color-primary-transparent);
  }
}

.logoutItem:hover {
  background-color: var(--color-warn-transparent);
}
</style>
