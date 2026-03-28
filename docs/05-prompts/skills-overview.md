# Custom Claude Code Skills — Overview

This document describes the custom skill system defined in `.claude/skills/`. Each skill is a focused, project-aware prompt guide that shapes how Claude Code approaches a specific category of work on this platform.

## How to Use a Skill

Reference a skill at the start of a task by naming it:

```
Use the clerk-b2b-auth skill to add auth protection to this new route.
Use the prisma-migrations skill to add the ApiKey model to the schema.
Use the frontend-design skill to build the billing settings page.
```

Claude Code will load the skill's SKILL.md and apply its rules, conventions, and patterns to the task.

You can also combine skills:

```
Use the frontend-design and saas-ux-copy skills to build the org members page
with proper empty states and copy.
```

---

## Skill Index

### `frontend-design`

**Path:** `.claude/skills/frontend-design/SKILL.md`

**Purpose:** Build UI components and pages using Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.

**Use when:**

- Building any new page, layout, form, or data table
- Creating or promoting components to `packages/ui`
- Deciding between RSC and Client Components

**Key rules:**

- Default to React Server Components; `"use client"` only when necessary
- Validate with Zod + `react-hook-form`; schema from `packages/types`
- Use `cn()` for class merging, never string concatenation
- Every list/table has an explicit empty state
- Every data-fetching component has a Suspense skeleton

---

### `saas-ux-copy`

**Path:** `.claude/skills/saas-ux-copy/SKILL.md`

**Purpose:** Write consistent, clear, B2B-appropriate copy for all user-facing text.

**Use when:**

- Writing CTAs, empty states, error messages, tooltips, or confirmation dialogs
- Reviewing page copy before shipping
- Writing onboarding steps, upgrade prompts, or billing copy

**Key rules:**

- Use the project terminology glossary (Organization, Member, Plan — not workspace, user, tier)
- Destructive confirmations name the specific thing being destroyed
- Every error message includes what failed and what to do next
- No "Something went wrong." — always be specific

---

### `clerk-b2b-auth`

**Path:** `.claude/skills/clerk-b2b-auth/SKILL.md`

**Purpose:** Implement Clerk authentication and authorization patterns for B2B multi-tenant context.

**Use when:**

- Adding auth protection to a new route or app
- Implementing role-based access checks
- Writing Clerk webhook sync handlers
- Adding platform-level role checks for admin access

**Key rules:**

- Always derive `orgId` from `auth()` — never from URL or request body
- Three authorization layers: middleware → route → domain query
- Re-verify `isPlatformAdmin()` in every admin Server Action (not just middleware)
- Use `packages/auth` role utility functions — no inline role string comparisons

---

### `billing-architecture`

**Path:** `.claude/skills/billing-architecture/SKILL.md`

**Purpose:** Implement billing domain features using the payment provider abstraction.

**Use when:**

- Adding entitlement checks to product features
- Writing subscription CRUD operations
- Building billing UI in the dashboard or admin
- Implementing or extending a payment provider adapter

**Key rules:**

- Product code uses `checkEntitlement()` only — never queries subscriptions directly
- All amounts are integers in cents — never floats
- `NullPaymentProvider` is the v1 default (not a mock — it runs in production)
- Every billing state change writes to `AuditLog`

---

### `prisma-migrations`

**Path:** `.claude/skills/prisma-migrations/SKILL.md`

**Purpose:** Make PostgreSQL schema changes safely using Prisma Migrate.

**Use when:**

- Adding tables, columns, indexes, or enum values
- Making breaking schema changes (renames, type changes, removing columns)
- Setting up or updating the database seed script

**Key rules:**

- Forward-only migrations — never edit an applied migration file
- Breaking changes use two-phase migration (add → backfill → remove)
- Migration names are descriptive snake_case (`add_subscription_pause_fields`)
- `prisma migrate dev` on local only; `prisma migrate deploy` in CI

---

### `admin-crud-patterns`

**Path:** `.claude/skills/admin-crud-patterns/SKILL.md`

**Purpose:** Build consistent CRUD interfaces for `apps/admin`.

**Use when:**

- Adding a new admin section (organizations, plans, subscriptions, etc.)
- Building data tables with search, pagination, and actions
- Adding confirmation dialogs for destructive admin operations

**Key rules:**

- Re-verify platform role in every Server Action (middleware is not enough)
- Every admin mutation writes to `AuditLog` with `actorType: "ADMIN"` and a reason
- Destructive actions use `AlertDialog` — not `window.confirm`
- Filters are URL-based (`?q=&page=`) for shareability

---

### `docs-maintainer`

**Path:** `.claude/skills/docs-maintainer/SKILL.md`

**Purpose:** Keep `/docs/01-architecture/` accurate and in sync with code changes.

**Use when:**

- An architectural decision changes
- A new domain, app, or package is added
- The schema, auth model, or billing architecture evolves
- Phases in the roadmap are completed

**Key rules:**

- Minimal edits — only update what changed
- Code is the source of truth when docs and code conflict
- Delete outdated sections rather than leaving stale content
- Preserve the "why" even when the "what" changes

---

### `branch-workflow`

**Path:** `.claude/skills/branch-workflow/SKILL.md`

**Purpose:** Follow the Git branching strategy and commit conventions correctly.

**Use when:**

- Starting a new feature or fix
- Creating or reviewing a PR
- Handling a production hotfix
- Unsure whether to target `develop` or `main`

**Key rules:**

- Branch from `develop`; PR targets `develop` (not `main`)
- Conventional Commits format enforced: `feat(scope): description`
- Squash-merge feature branches into `develop`
- Hotfixes branch from `main` and must be back-merged to `develop`

---

### `landing-page-conversion`

**Path:** `.claude/skills/landing-page-conversion/SKILL.md`

**Purpose:** Build high-converting marketing pages for `apps/web`.

**Use when:**

- Building or updating the homepage, product pages, or pricing page
- Evaluating whether a page structure supports conversion
- Choosing what sections to include and in what order

**Key rules:**

- One primary CTA per page — all content supports it
- Benefit-led copy: outcome first, feature second
- Social proof before the first CTA
- Plan data on the pricing page comes from the database (not hardcoded)
- All primary CTAs link to `NEXT_PUBLIC_DASHBOARD_URL/sign-up`

---

### `seo-content-structure`

**Path:** `.claude/skills/seo-content-structure/SKILL.md`

**Purpose:** Structure `apps/web` pages for search discoverability using Next.js Metadata API and JSON-LD.

**Use when:**

- Adding any new public route to `apps/web`
- Writing page metadata, OG tags, or structured data
- Setting up or updating the sitemap
- Reviewing a page's SEO completeness

**Key rules:**

- Use `export const metadata` or `generateMetadata()` — never `<head>` tags directly
- One H1 per page; headings follow strict hierarchy
- Title format: `[Page Name] — CollectiveMind` (max 60 chars)
- Dynamic product pages use `generateMetadata()` with DB data
- Auth and dashboard routes are `noindex`

---

### `observability-sentry`

**Path:** `.claude/skills/observability-sentry/SKILL.md`

**Purpose:** Instrument server code with structured logging and Sentry error tracking.

**Use when:**

- Adding logging to a new Route Handler, Server Action, or webhook
- Integrating Sentry into an app
- Adding error boundaries to pages
- Reviewing code that logs too much, too little, or incorrectly

**Key rules:**

- Use the shared `logger` utility from `packages/utils` — never `console.log` in production code
- Never log PII (email, name, phone, payment data) — log IDs only
- Sentry user context uses `userId` only — never email or name
- `AuditLog` (DB) is for business events; application logs are for diagnostics
- `maskAllInputs: true` in Sentry replay config

---

### `test-strategy`

**Path:** `.claude/skills/test-strategy/SKILL.md`

**Purpose:** Determine what to test and at what layer for every type of change.

**Use when:**

- Adding tests to a new feature
- Choosing between unit, integration, and E2E tests
- Writing tests for DB-dependent code (billing, auth, webhooks)
- Setting up test infrastructure for a new package

**Key rules:**

- No mocking Prisma — use a real test database with cleanup helpers
- Integration tests for all domain functions that touch the DB
- Unit tests for pure functions in `packages/utils` and `packages/types`
- E2E tests for the 5–7 critical user flows only (not everything)
- Test behavior, not implementation — tests must survive refactoring

---

## Skill Interaction Map

Some tasks require multiple skills working together:

| Task                               | Skills                                                               |
| ---------------------------------- | -------------------------------------------------------------------- |
| New dashboard page with data table | `frontend-design` + `clerk-b2b-auth`                                 |
| Billing settings page copy         | `saas-ux-copy` + `billing-architecture`                              |
| New Prisma model + DB seed         | `prisma-migrations`                                                  |
| Admin subscription management      | `admin-crud-patterns` + `billing-architecture`                       |
| New marketing product page         | `landing-page-conversion` + `seo-content-structure` + `saas-ux-copy` |
| Auth webhook sync                  | `clerk-b2b-auth` + `prisma-migrations`                               |
| Feature with error tracking        | `observability-sentry` + any feature skill                           |
| Any feature with tests             | `test-strategy` + the feature's domain skill                         |
| Architectural change               | `docs-maintainer`                                                    |
| Any code commit or PR              | `branch-workflow`                                                    |

---

## Adding New Skills

When a new recurring pattern emerges that doesn't fit an existing skill, create a new one:

```
.claude/skills/[skill-name]/
  SKILL.md
```

SKILL.md must contain:

1. **Purpose** — what problem this skill solves
2. **When to Use** — specific trigger conditions
3. **Rules and Guardrails** — what to always/never do
4. **Step-by-Step Working Instructions** — how to apply the skill with code examples
5. **Project-Specific Conventions** — naming, patterns, file locations
6. **Examples** — concrete, runnable code samples

After creating, add an entry to this overview doc.
