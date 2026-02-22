import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/", "coverage/", "scripts/"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Allow `interface Foo extends Bar {}` — stylistically fine, not the empty-object footgun
      "@typescript-eslint/no-empty-object-type": [
        "error",
        { allowInterfaces: "with-single-extends" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      eqeqeq: ["error", "smart"],
    },
  },
  {
    files: ["**/*.test.ts", "**/__tests__/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
