import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import jsxA11y from "eslint-plugin-jsx-a11y";
import playwright from "eslint-plugin-playwright";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "build/**",
    "public/**",
    ".react-router/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "blob-report/**",
  ]),

  {
    files: ["**/*.{ts,tsx,mjs}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  {
    files: ["app/**/*.{ts,tsx}", "test/**/*.ts"],
    extends: [
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
      jsxA11y.flatConfigs.recommended,
      reactHooks.configs.flat["recommended-latest"],
    ],
    languageOptions: { globals: globals.browser },
    settings: { react: { version: "detect" } },
    rules: {
      "react/prop-types": "off",
      // Loaders and actions bail out by throwing a `Response` (redirect, 404).
      "@typescript-eslint/only-throw-error": [
        "error",
        { allow: [{ from: "lib", name: "Response" }] },
      ],
    },
  },

  // Dependencies flow routes → features → shared.
  {
    files: ["app/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["~/routes", "~/routes/**", "**/routes/**"],
              message: "Features must not depend on route modules.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "~/features",
                "~/features/**",
                "~/routes",
                "~/routes/**",
                "**/features/**",
                "**/routes/**",
              ],
              message: "Shared code must not depend on features or routes.",
            },
          ],
        },
      ],
    },
  },

  {
    files: ["scripts/**/*.mjs", "*.config.{ts,mjs}"],
    languageOptions: { globals: globals.node },
  },
  {
    // `.mjs` files are not part of the TypeScript program.
    files: ["**/*.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  {
    files: ["e2e/**/*.ts"],
    extends: [playwright.configs["flat/recommended"]],
    languageOptions: { globals: globals.node },
  },

  prettier,
]);
