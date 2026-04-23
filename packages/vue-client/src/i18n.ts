import { createI18n } from "vue-i18n";
import type { I18n } from "vue-i18n";

import en from "./locales/en.json";
import de from "./locales/de.json";

function getBrowserLocale(): string {
  const locale = navigator.language || navigator.languages[0] || "en";
  return locale.split("-")[0]; // Get language code (e.g., 'en' from 'en-US')
}

const SUPPORTED_LOCALES = ["en", "de"];

const initialLocale = (() => {
  const browserLocale = getBrowserLocale();
  return SUPPORTED_LOCALES.includes(browserLocale) ? browserLocale : "en";
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
