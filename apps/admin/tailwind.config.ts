import type { Config } from "tailwindcss"
import baseConfig from "@repo/config/tailwind"
import animatePlugin from "tailwindcss-animate"

const config: Config = {
  ...baseConfig,
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  plugins: [animatePlugin],
}

export default config
