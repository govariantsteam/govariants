/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: [
    "plugin:vue/vue3-recommended",
    "eslint:recommended",
    "@vue/eslint-config-typescript/recommended",
    "@vue/eslint-config-prettier",
  ],
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
    "prettier/prettier": ["error", { endOfLine: "auto" }],
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
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

    // TODO: Temporarily disabled vue3-recommended rules that require codebase refactoring
    "vue/prop-name-casing": "off",
    "vue/no-template-shadow": "off",
    "vue/require-default-prop": "off",
    "vue/no-v-html": "off",
  },
};
