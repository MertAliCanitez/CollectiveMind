import { nextjs } from "@repo/config/eslint"
import tseslint from "typescript-eslint"

export default tseslint.config(...nextjs, {
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: import.meta.dirname,
    },
  },
  ignores: ["dist/**", "node_modules/**", ".next/**"],
})
