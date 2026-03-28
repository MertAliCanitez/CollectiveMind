// @ts-check
import js from "@eslint/js"
import tseslint from "typescript-eslint"
import reactPlugin from "eslint-plugin-react"
import reactHooksPlugin from "eslint-plugin-react-hooks"
import prettierConfig from "eslint-config-prettier"

/**
 * Base ESLint config for all packages (TypeScript + strict).
 * Uses `recommended` (not `recommendedTypeChecked`) because type-checked rules
 * require per-package tsconfig wiring via languageOptions.parserOptions.project.
 * Add type-checked rules to individual packages once their tsconfigs are ready.
 * @type {import("typescript-eslint").ConfigArray}
 */
export const base = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
)

/**
 * Next.js specific config
 * @type {import("typescript-eslint").ConfigArray}
 */
export const nextjs = tseslint.config(...base, {
  plugins: {
    react: reactPlugin,
    "react-hooks": reactHooksPlugin,
  },
  rules: {
    ...reactPlugin.configs.recommended.rules,
    ...reactHooksPlugin.configs.recommended.rules,
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
})
