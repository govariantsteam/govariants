<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useLocalStorage } from "@vueuse/core";
import { useCurrentUser, useStore } from "@/stores/user";
import { useRouter } from "vue-router";
import PushNotificationToggle from "@/components/PushNotificationToggle.vue";
import { LOCAL_STORAGE_KEYS } from "@/local_storage_keys";
import {
  LOCALE_NAMES,
  SUPPORTED_LOCALES,
  rememberLocale,
  type SupportedLocale,
} from "@/i18n";

const store = useStore();
const user = useCurrentUser();
const router = useRouter();

// Settings are account-scoped, so there is nothing to show to a signed-out
// visitor. The check has to wait for /checkLogin: the store starts out empty
// even for someone who is signed in, and redirecting on that would bounce them.
const ready = ref(false);
store.update().then(() => {
  if (user.value) {
    ready.value = true;
  } else {
    router.replace("/login");
  }
});

const { locale } = useI18n({ useScope: "global" });
const selectedLocale = ref(locale.value as SupportedLocale);
watch(selectedLocale, (chosen) => {
  locale.value = chosen;
  rememberLocale(chosen);
});

// Shares a key with the in-game checkbox, so flipping either moves both.
const immediateSubmit = useLocalStorage(
  LOCAL_STORAGE_KEYS.immediateSubmit,
  false,
);
</script>

<template>
  <main>
    <div v-if="ready && user" class="grid-page-layout">
      <div class="settings-column">
        <h1>{{ $t("settings") }}</h1>

        <section>
          <h2>{{ $t("settings-page.language") }}</h2>
          <select v-model="selectedLocale" aria-label="Language">
            <option v-for="code in SUPPORTED_LOCALES" :key="code" :value="code">
              {{ LOCALE_NAMES[code] }}
            </option>
          </select>
        </section>

        <PushNotificationToggle />

        <section>
          <h2>{{ $t("settings-page.gameplay") }}</h2>
          <div class="setting-row">
            <input
              id="immediate-submit"
              v-model="immediateSubmit"
              type="checkbox"
            />
            <label for="immediate-submit">
              {{ $t("settings-page.immediate-submit") }}
            </label>
          </div>
          <p class="setting-hint">
            {{ $t("settings-page.immediate-submit-hint") }}
          </p>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.settings-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.setting-hint {
  margin: 0.25em 0 0;
  font-size: 0.9em;
  opacity: 0.8;
}
</style>
