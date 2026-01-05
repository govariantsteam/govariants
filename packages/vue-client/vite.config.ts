import { fileURLToPath, URL } from "url";

import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@ogfcommunity/variants-shared/src": fileURLToPath(
        new URL("../shared/src", import.meta.url),
      ),
      "@ogfcommunity/variants-shared": fileURLToPath(
        new URL("../shared/src", import.meta.url),
      ),
    },
    preserveSymlinks: true, // defaults to false, but with default imports from @ofgcommunity/variants-shared in componentes don't work
  },
  server: {
    proxy: {
      "/api": {
        secure: false,
        target: "http://localhost:3001/",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
});
