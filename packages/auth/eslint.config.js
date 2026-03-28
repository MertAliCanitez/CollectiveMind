import { base } from "@repo/config/eslint"
import tseslint from "typescript-eslint"

export default tseslint.config(...base, {
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: import.meta.dirname,
    },
  },
  ignores: ["dist/**", "node_modules/**"],
})
