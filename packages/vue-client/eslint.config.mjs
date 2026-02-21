import pluginVue from "eslint-plugin-vue";
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from "@vue/eslint-config-typescript";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";

export default defineConfigWithVueTs(
  {
    ignores: ["dist/", "coverage/"],
  },

  pluginVue.configs["flat/recommended"],
  vueTsConfigs.recommended,

  {
    rules: {
      // Override vue3-recommended's html-self-closing to set void elements to "always"
      // instead of "never". This prevents conflicts with Prettier, which formats
      // void elements as self-closing (e.g., <br /> instead of <br>).
      "vue/html-self-closing": [
        "error",
        {
          html: {
            void: "always",
            normal: "always",
            component: "always",
          },
          svg: "always",
          math: "always",
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "vue/enforce-style-attribute": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@ogfcommunity/variants-shared/src/*",
                "**/shared/**",
                "shared/**",
              ],
              message:
                "Import the shared package using the package alias: import {X} from '@ogfcommunity/variants-shared' (not via a relative path).",
            },
          ],
        },
      ],
      eqeqeq: ["error", "smart"],

      // TODO(#448): Temporarily disabled vue3-recommended rules require manual fixes
      "vue/prop-name-casing": "off", // 19 issues
      "vue/no-template-shadow": "off", // 1 issue
      "vue/require-default-prop": "off", // 2 issues
      "vue/no-v-html": "off", // 1 issue
    },
  },

  skipFormatting,
);
