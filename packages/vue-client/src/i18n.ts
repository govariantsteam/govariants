import { createI18n } from "vue-i18n";
import type { I18n } from "vue-i18n";
import { useLocalStorage } from "@vueuse/core";
import { LOCAL_STORAGE_KEYS } from "./local_storage_keys";

import en from "./locales/en.json";
import de from "./locales/de.json";

export const SUPPORTED_LOCALES = ["en", "de"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  en: "English",
  de: "Deutsch",
};

const storedLocale = useLocalStorage(LOCAL_STORAGE_KEYS.locale, "", {
  writeDefaults: false,
});

export function rememberLocale(locale: SupportedLocale): void {
  storedLocale.value = locale;
}

function isSupported(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

function getBrowserLocale(): string {
  const locale = navigator.language || navigator.languages[0] || "en";
  return locale.split("-")[0]; // Get language code (e.g., 'en' from 'en-US')
}

const initialLocale = ((): SupportedLocale => {
  if (isSupported(storedLocale.value)) {
    return storedLocale.value;
  }
  const browserLocale = getBrowserLocale();
  return isSupported(browserLocale) ? browserLocale : "en";
})();

const i18n: I18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: "en",
  messages: {
    en,
    de,
  },
  globalInjection: true,
  missingWarn: false,
  fallbackWarn: false,
});

export default i18n;
