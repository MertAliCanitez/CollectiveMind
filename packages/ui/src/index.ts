/**
 * @repo/ui — Shared component library
 *
 * Components are added via shadcn/ui CLI:
 *   pnpm dlx shadcn@latest add button
 *
 * All installed components are re-exported from here so apps import from @repo/ui.
 */

// Utility
export { cn } from "./lib/utils.js"

// Components will be added here as they are installed via shadcn/ui.
// Example after running `pnpm dlx shadcn@latest add button`:
//   export { Button, buttonVariants } from "./components/button.js"
