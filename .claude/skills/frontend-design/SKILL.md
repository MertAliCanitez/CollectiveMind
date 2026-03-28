# Skill: frontend-design

## Purpose

Build UI components and pages for this platform using the established stack: **Next.js App Router**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**. Produces consistent, accessible, responsive interfaces across `apps/web`, `apps/dashboard`, and `apps/admin`.

## When to Use

Invoke this skill when:
- Building a new page, layout, or route
- Creating a new reusable component in `packages/ui`
- Adding a form, data table, modal, or interactive UI pattern
- Reviewing an existing component for design consistency
- Translating a design spec or description into code

## Stack Constraints

| Concern | Tool | Notes |
|---------|------|-------|
| Components | shadcn/ui | Install via `pnpm dlx shadcn@latest add [component]` |
| Styling | Tailwind CSS | Utility-first, no inline styles, no CSS modules unless unavoidable |
| Icons | `lucide-react` | Already a shadcn/ui dependency |
| Fonts | `next/font` | Never import fonts from Google CDN directly |
| Animations | `tailwindcss-animate` | Built into shadcn/ui setup; no Framer Motion at v1 |
| Forms | `react-hook-form` + `zod` | All form state via RHF; validation schema from `packages/types` |

## Rules and Guardrails

**Rendering model:**
- Default to **React Server Components (RSC)**. Add `"use client"` only when the component requires browser APIs, event handlers, or React hooks (`useState`, `useEffect`, `useRef`).
- Never add `"use client"` to a layout file — it forces the entire subtree to be client-rendered.
- Data fetching happens in Server Components via direct `async/await`. Never use `useEffect` for data fetching.

**Component boundaries:**
- Interactive shells (e.g., a dialog trigger) are Client Components.
- The content inside the dialog that fetches data is a Server Component passed as `children`.
- This pattern keeps data fetching on the server while enabling interactivity.

**Styling:**
- Use Tailwind utility classes only. No arbitrary `style={{}}` props except for truly dynamic values (e.g., a progress bar width from a variable).
- Use `cn()` (from `packages/ui/src/lib/utils.ts`) for conditional class merging — never string concatenation.
- Respect the design token system: use `bg-background`, `text-foreground`, `border-border`, etc. from the shadcn/ui CSS variables. Never hardcode `#hex` values in component classes.

**Accessibility:**
- All interactive elements must have accessible labels (`aria-label`, `aria-describedby`, or visible text).
- Form inputs always have associated `<label>` elements (use shadcn/ui `<Label>` component).
- Color alone must never convey meaning — pair color with text or icon.
- Focus styles must never be removed (`outline-none` without a custom focus ring is banned).

**No component sprawl:**
- Before creating a new component, check `packages/ui/src/components/` and the app's own `components/` directory.
- A component that is used in only one place lives in that app's `components/` folder.
- A component used across two or more apps is promoted to `packages/ui`.

## Step-by-Step Working Instructions

### 1. Understand the context before writing code

Read the relevant route file and any parent layouts. Understand:
- What data is available from the server (RSC props / `params` / `searchParams`)
- What the user interaction model is (read-only view, form, interactive table)
- What role sees this component (customer, org admin, platform admin)

### 2. Identify the shadcn/ui primitives needed

Map the design to primitives before writing custom JSX:
- List/table of records → `<Table>` + `<DataTable>` pattern
- Action dialogs → `<Dialog>` or `<AlertDialog>`
- Forms → `<Form>` with RHF + `<Input>`, `<Select>`, `<Textarea>`
- Status indicators → `<Badge>` with variant
- Navigation → `<Tabs>`, `<NavigationMenu>`, `<Breadcrumb>`
- Notifications → `<Sonner>` (toast)

If a required shadcn/ui component is not yet installed, add it:
```bash
pnpm dlx shadcn@latest add dialog
```

### 3. Build from outer layout inward

```
Page (RSC, fetches data)
  └── Layout shell (RSC or Client depending on nav state)
        └── Content sections (RSC where possible)
              └── Interactive elements (Client Components, smallest scope)
```

### 4. Form pattern

```tsx
// Schema lives in packages/types
import { CreateOrgSchema } from "@repo/types"

// Form component — always "use client"
"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@repo/ui"

export function OrgForm() {
  const form = useForm({ resolver: zodResolver(CreateOrgSchema) })

  async function onSubmit(values) {
    // Call Server Action or API route
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
```

### 5. Loading and error states

Every data-fetching Server Component has:
- A `loading.tsx` sibling (Next.js Suspense boundary) — use `<Skeleton>` from shadcn/ui
- An `error.tsx` sibling for error boundaries — always a Client Component

### 6. Empty states

Every list or table component has an explicit empty state:
```tsx
{items.length === 0 ? (
  <EmptyState
    icon={<UsersIcon />}
    title="No members yet"
    description="Invite your team to get started."
    action={<InviteMemberButton />}
  />
) : (
  <DataTable data={items} columns={columns} />
)}
```

## Project-Specific Conventions

### App-specific component locations

```
apps/dashboard/components/    ← dashboard-only components
apps/admin/components/        ← admin-only components
apps/web/components/          ← marketing-only components
packages/ui/src/components/   ← shared across apps
```

### Naming

- Page files: `page.tsx` (Next.js convention)
- Layout files: `layout.tsx`
- Server Components: PascalCase, no suffix — `OrgSettingsPage`
- Client Components: PascalCase with no suffix — but the file should have a comment at top: `"use client"`
- Hooks: `use` prefix — `useOrgMembers`

### The `cn()` utility

```tsx
import { cn } from "@repo/ui/lib/utils"

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "destructive" && "destructive-classes"
)} />
```

### shadcn/ui variant pattern

Extend shadcn/ui variants using `cva` — never modify the original shadcn/ui component files directly. Copy and extend:

```tsx
// packages/ui/src/components/status-badge.tsx
import { cva } from "class-variance-authority"

const statusBadge = cva("...", {
  variants: {
    status: {
      active: "bg-green-100 text-green-800",
      trialing: "bg-blue-100 text-blue-800",
      canceled: "bg-red-100 text-red-800",
    }
  }
})
```

## Examples

### Subscription status badge

```tsx
// packages/ui/src/components/subscription-status-badge.tsx
import { Badge } from "./badge"
import type { SubscriptionStatus } from "@repo/types"

const statusConfig: Record<SubscriptionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE:   { label: "Active",   variant: "default" },
  TRIALING: { label: "Trial",    variant: "secondary" },
  PAST_DUE: { label: "Past due", variant: "destructive" },
  PAUSED:   { label: "Paused",   variant: "outline" },
  CANCELED: { label: "Canceled", variant: "outline" },
}

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  const { label, variant } = statusConfig[status]
  return <Badge variant={variant}>{label}</Badge>
}
```

### Async Server Component page with Suspense

```tsx
// app/(protected)/dashboard/page.tsx
import { Suspense } from "react"
import { ProductGrid } from "@/components/product-grid"
import { ProductGridSkeleton } from "@/components/product-grid-skeleton"

export default function DashboardPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold">Your Products</h1>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid />
      </Suspense>
    </main>
  )
}

// ProductGrid is async RSC — fetches its own data
async function ProductGrid() {
  const { orgId } = auth()
  const products = await getActiveProducts(orgId)
  // ...
}
```
