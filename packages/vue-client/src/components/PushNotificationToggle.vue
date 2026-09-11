<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faBell, faBellSlash } from "@fortawesome/free-solid-svg-icons";
import { useCurrentUser, useStore } from "@/stores/user";
import { SITE_NAME } from "@govariants/shared";
import {
  disablePush,
  enablePush,
  getPushState,
  type PushState,
} from "@/utils/push";

library.add(faBell, faBellSlash);

const state = ref<PushState | null>(null);
const busy = ref(false);
const store = useStore();
const user = useCurrentUser();

watchEffect(async () => {
  // Push subscriptions belong to an account, so there is nothing to show or
  // ask for until someone is signed in.
  if (user.value && store.csrf_token) {
    state.value = await getPushState().catch(() => null);
  } else {
    state.value = null;
  }
});

async function toggle(): Promise<void> {
  busy.value = true;
  try {
    state.value =
      state.value === "enabled" ? await disablePush() : await enablePush();
  } catch (error) {
    alert(error instanceof Error ? error.message : String(error));
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <!--
    Nothing is rendered when the browser cannot do push, or when the site has
    no VAPID keys configured: offering a button that cannot work is worse than
    staying quiet.
  -->
  <div
    v-if="state && state !== 'unsupported' && state !== 'unavailable'"
    class="push-toggle"
  >
    <template v-if="state === 'denied'">
      <FontAwesomeIcon icon="fa-solid fa-bell-slash" />
      <span>
        This browser is blocking notifications from {{ SITE_NAME }}. You can
        allow them again in your browser's site settings.
      </span>
    </template>
    <template v-else>
      <button :disabled="busy" @click="toggle">
        <FontAwesomeIcon
          :icon="
            state === 'enabled' ? 'fa-solid fa-bell' : 'fa-solid fa-bell-slash'
          "
        />
        {{
          state === "enabled"
            ? "Turn off browser notifications"
            : "Turn on browser notifications"
        }}
      </button>
      <span>
        {{
          state === "enabled"
            ? "This browser will show a notification when something happens in a game you follow."
            : "Get notified on this device even when the site is closed. Uses the notification options you already chose per game."
        }}
      </span>
    </template>
  </div>
</template>

<style scoped>
.push-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75em;
  margin-bottom: 1em;
  padding: 0.75em 1em;
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

button {
  padding: 0.4em 0.8em;
  color: var(--color-text);
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 4px;

  &:not([disabled]) {
    cursor: pointer;

    &:hover {
      background-color: var(--color-primary-transparent);
    }
  }
}

span {
  color: var(--color-text);
  font-size: 0.9em;
}
</style>
