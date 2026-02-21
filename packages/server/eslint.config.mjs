import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/", "coverage/", "migrations/"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: "tsconfig.eslint.json",
        sourceType: "module",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      eqeqeq: ["error", "smart"],
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
    },
  },
);
