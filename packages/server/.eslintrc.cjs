module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  root: true,
  rules: {
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    eqeqeq: ["error", "smart"],
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          "@ogfcommunity/variants-shared/src/*",
          "**/shared/**",
          "shared/**",
        ],
        paths: [
          {
            name: "shared",
            message:
              "Import the shared package using the package alias: import {X} from '@ogfcommunity/variants-shared' (not via a relative path).",
          },
        ],
      },
    ],
  },
};
