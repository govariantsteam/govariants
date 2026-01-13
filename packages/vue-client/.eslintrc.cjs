/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/eslint-config-typescript/recommended",
    "@vue/eslint-config-prettier",
  ],
  rules: {
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
              "/shared/",
              "shared/**",
            ],
            message:
              "Import the shared package using the package alias: import {X} from '@ogfcommunity/variants-shared' (not via a relative path).",
          },
        ],
      },
    ],
    eqeqeq: ["error", "smart"],
  },
};
