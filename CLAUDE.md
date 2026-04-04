# CLAUDE.md — CollectiveMind

Project-level guidance for Claude Code. Rules here override default behaviour.

---

## What this project is

CollectiveMind is a multi-product B2B SaaS platform. Three Next.js apps share a set of internal packages in a Turborepo + pnpm monorepo. The platform is at v1 — billing infrastructure exists but uses a `NullPaymentProvider` (no real payment processor yet). Clerk handles all authentication. PostgreSQL + Prisma handle data persistence.

---

## Repository layout

```
apps/
  web/          # Marketing site — public, no auth (port 3000)
  dashboard/    # Customer-facing app — Clerk + org-gating (port 3001)
  admin/        # Internal ops panel — Clerk (port 3002)
packages/
  auth/         # @repo/auth — Clerk middleware, webhook sync, role helpers
  billing/      # @repo/billing — subscription state machine, PaymentProvider abstraction
  database/     # @repo/database — Prisma client wrapper, re-exports generated types
  shared/       # @repo/shared — logger, env, currency utils, Zod schemas
  ui/           # @repo/ui — shadcn/ui components, globals.css, Tailwind base
  config/       # @repo/config — ESLint, Prettier, TypeScript, Tailwind shared configs
  testing/      # @repo/testing — vitest helpers, cleanDatabase(), factories
prisma/
  schema.prisma # Single schema, managed by packages/database
  seed.ts
```

---

## Commands

Run everything from the repo root via Turborepo. Do not `cd` into apps to run tasks unless explicitly necessary.

```bash
# Development (all apps in parallel)
pnpm dev

# Individual app dev servers
pnpm --filter @repo/web dev        # http://localhost:3000
pnpm --filter @repo/dashboard dev  # http://localhost:3001
pnpm --filter @repo/admin dev      # http://localhost:3002

# Type check / lint / format
pnpm turbo type-check
pnpm turbo lint
pnpm format            # write
pnpm format:check      # CI check

# Tests (requires a running Postgres — see DATABASE_URL)
pnpm turbo test
pnpm --filter @repo/billing test
pnpm --filter @repo/auth test

# Build
pnpm turbo build

# Database
pnpm db:generate        # regenerate Prisma client after schema changes
pnpm db:migrate         # apply migrations in dev
pnpm db:migrate:deploy  # apply migrations in prod/CI
pnpm db:validate        # validate schema without migrating
pnpm db:seed            # seed product catalogue
pnpm db:studio          # Prisma Studio
```

Always run `pnpm turbo type-check && pnpm turbo lint` before committing.

---

## Git workflow

- `main` is the only long-lived branch. No `develop`, no `staging`.
- Always branch from current `main`.
- One concern per branch.
- CI must pass before merging.
- Squash merge only — one clean commit on `main` per PR.
- Delete source branch after merge.
- Claude Code does **not** merge to `main` or open PRs without explicit instruction.

### Branch naming

| Pattern           | Use for                                      |
|-------------------|----------------------------------------------|
| `feature/<slug>`  | New functionality                            |
| `fix/<slug>`      | Bug fix                                      |
| `refactor/<slug>` | Structural change, no behaviour change       |
| `chore/<slug>`    | Deps, config, tooling                        |
| `docs/<slug>`     | Documentation only                           |
| `test/<slug>`     | Tests only                                   |
| `db/<slug>`       | Prisma schema / migration changes            |

Slug: lowercase, hyphen-separated, ≤ 40 chars.

### Commit format

Conventional Commits. Summary is imperative, ≤ 72 chars, no trailing period.

```
<type>(<scope>): <summary>

[body: why, not what — the diff shows the what]

[Closes #42]
[Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>]
```

**Types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `db`, `perf`, `ci`

**Scopes:** `auth`, `billing`, `admin`, `dashboard`, `web`, `db`, `ui`, `shared`, `config`, `ci`, `hardening`, `testing`

### Solo development workflow

This repository is currently maintained in a solo-founder workflow. Claude may create branches, commit, and push when requested. Claude does not assume a second reviewer exists.

- If branch protection rules would block solo progress, state this clearly and ask whether to keep strict requirements or relax them temporarily.
- All merges to `main` require explicit user confirmation — Claude does not self-merge.

---

## Code conventions

### TypeScript

- Strict mode across all packages. `"no-explicit-any": "error"` — no `any`, ever.
- `"consistent-type-imports": "error"` — use `import type` for type-only imports.
- Unused vars with `_` prefix are allowed; all others are errors.

### Logging

- **No `console.log`** in any production code. ESLint enforces this.
- Use `logger` from `@repo/shared` — `logger.info`, `logger.warn`, `logger.error`.
- **Never log PII** — log IDs only, never names, emails, or payment data.

### Validation

- **Zod at all system boundaries** — Server Actions, webhook routes, API routes.
- Never trust request params for IDs that affect auth or billing.

### Imports

- Workspace packages import from their declared `exports` entries only (e.g. `@repo/database`, `@repo/auth`), not deep paths.
- Internal `.js` extensions in package source are required by `moduleResolution: NodeNext`. Do not change them.

---

## Product access model (source of truth)

**Role is not entitlement.** This is the single most important access-control rule in the platform.

- An organization role (`customer_owner`, `customer_member`, `customer_billing_manager`) controls what a user can *manage* (org settings, billing, members). It does **not** grant access to any product.
- A user sees only the products their organization has an active **Subscription** or **AccessGrant** for.
- A `customer_owner` with no subscriptions and no access grants sees no products.
- A `customer_member` in an org with a product subscription has the same product access as the `customer_owner` of that org.

### Two paths to product access

| Path | Description |
| ---- | ----------- |
| `Subscription` | Org has a paid, trialing, or free-tier subscription to a Plan for a Product. |
| `AccessGrant` | Staff explicitly granted the org direct access to a Product (trial, complimentary, migration). |

`checkEntitlement({ orgId, productSlug })` in `@repo/billing` checks both. An active, non-expired, non-revoked `AccessGrant` takes precedence.

### Roles (canonical names)

| Canonical Name | Clerk value | Scope |
| -------------- | ----------- | ----- |
| `platform_super_admin` | `"super_admin"` (publicMetadata) | Internal staff — full admin panel access |
| `platform_support` | `"support"` (publicMetadata) | Internal staff — read-only admin access |
| `customer_owner` | `"org:admin"` | Customer org — account management |
| `customer_billing_manager` | `"org:billing_manager"` | Customer org — billing only |
| `customer_member` | `"org:member"` | Customer org — standard member |

When implementing any customer-facing product list, product launcher, or entitlement gate: **always use `checkEntitlement()`, never use role checks**.

---

## Auth conventions (Clerk)

- Clerk is the **source of truth** for all authentication decisions. Never trust the DB mirror for auth.
- **`orgId` always comes from `auth()`** — never from URL params, request body, or DB lookups. Middleware is the first layer; route handlers and Server Components must call `auth()` themselves (defence in depth).
- `apps/dashboard/middleware.ts` enforces: public routes → pass, unauthenticated → /sign-in, authenticated + no org → /org-select.
- `apps/web` is fully public — its middleware is a no-op passthrough.
- Clerk webhooks sync User and Organization records to Postgres via `@repo/auth`. These DB records exist for relational integrity only — never for auth decisions.
- **Do not assume Clerk keys exist locally.** `apps/dashboard` and `apps/admin` cannot run meaningful auth flows without valid keys. If keys are missing, stop and ask — see the request protocol below.
- Do not bypass Clerk middleware with fake or placeholder secrets. CI uses placeholder values only because no auth flows execute during build/type-check.

### Admin access policy

**TODO: Admin authorization policy must be finalized before production use.**

The current `apps/admin` implementation authenticates via Clerk but does not enforce a role, email allowlist, or org restriction beyond being signed in. This is unfinished. Before implementing or relying on any admin access control, ask the user to confirm:

- Who should be able to access `apps/admin` (specific users, a Clerk role, an email domain, or environment-gating)
- Whether access is role-based, org-based, allowlist-based, or IP/environment-restricted
- Whether the restriction should live in middleware, Server Components, or both

Do not make access-control assumptions for the admin panel. If role checks are absent, treat this area as controlled/unfinished.

---

## Database conventions (Prisma + PostgreSQL)

- **All IDs are UUIDs** (`@id @default(uuid())`).
- **Soft deletes** via `deletedAt DateTime?` on identity tables (User, Organization). Hard delete everywhere else.
- **Money fields are integers in the smallest currency unit** (cents for USD). Never store floats for money.
- **All org-scoped queries must filter by `organizationId`** sourced from `auth()`, not from the request.
- **`providerXxx` fields** (e.g. `providerCustomerId`, `providerPriceId`) are `null` until a real `PaymentProvider` is wired. At v1 this is always null.
- Prisma schema lives at `prisma/schema.prisma`. Managed exclusively by `packages/database`.
- **Never edit a migration file after it has been committed.**
- After adding a new model, add it to the `TRUNCATE` statement in `packages/testing/src/helpers/database.ts` (`cleanDatabase()`).

---

## Billing conventions

- `@repo/billing` contains the subscription state machine and the `PaymentProvider` interface.
- At v1, `NullPaymentProvider` is active — all provider methods no-op. No real payment processor is wired.
- All subscription mutations go through the functions in `@repo/billing/src/subscriptions.ts` — never direct Prisma calls from routes.
- When a real provider is added, it must implement the `PaymentProvider` interface in `packages/billing/src/providers/interface.ts`. No product code should ever reference a concrete provider directly.
- **Do not assume Stripe is the chosen provider.** Future options include Stripe, Paddle, Lemon Squeezy, iyzico, and others. The decision depends on legal/business setup confirmed by the user.
- Live billing integration is intentionally deferred. If any task requires real billing integration, stop and follow the external input request protocol below.

---

## Testing conventions

- **No Prisma mocks** — use the real test database with `cleanDatabase()` from `@repo/testing`. This is a hard rule enforced by team convention after a prior incident where mock/prod divergence masked a broken migration.
- Test runner: Vitest. Config in each package/app that has tests.
- Test DB: `TEST_DATABASE_URL` (separate database from dev). CI spins up a real Postgres service container.
- `vitest.config.ts` in `apps/dashboard` uses `pool: "forks", singleFork: true` — tests run serially to avoid DB state conflicts. Do not change this.
- Factories live in `packages/testing/src/helpers/factories.ts`.

---

## Frontend / Tailwind conventions (apps/web)

- Dark theme is activated via `dark` class on `<html>` in `apps/web/app/layout.tsx`. Do not remove it.
- Base background: `#07070f` (near-black). All public pages use this as the root background.
- Custom keyframe animations (`neural-float`, `glow-pulse`, `glow-dot`, `gradient-shift`, `fade-in-up`, `card-reveal`) are defined in `packages/ui/src/globals.css`. Reference them via inline `style={{ animation: "..." }}` — do not add Tailwind `animate-*` classes for these.
- `darkMode: ["class"]` in the shared Tailwind base config. Dark CSS variables activate when `.dark` is on the html element.
- Workspace packages with TS source go in `transpilePackages` in `next.config.ts`. The `extensionAlias` webpack config maps `.js` → `.ts/.tsx` so NodeNext imports resolve correctly.
- shadcn/ui components are added to `packages/ui` via `pnpm dlx shadcn@latest add <name>` from the `packages/ui` directory, then re-exported from `packages/ui/src/index.ts`.

---

## CI pipeline (`.github/workflows/ci.yml`)

Six required checks, all must pass before merge:

| Job           | What it does                                           | Depends on              |
|---------------|--------------------------------------------------------|-------------------------|
| Lint          | `pnpm turbo lint`                                      | —                       |
| Format        | `pnpm format:check`                                    | —                       |
| Type Check    | `pnpm turbo type-check`                                | —                       |
| Prisma Schema | `pnpm db:validate`                                     | —                       |
| Tests         | `pnpm turbo test` against real Postgres                | lint, type-check, prisma|
| Build         | `pnpm turbo build`                                     | lint, type-check, prisma|

CI uses placeholder Clerk keys (`pk_test_placeholder`, `sk_test_placeholder`) — sufficient for type-check and build. Real secrets are not in CI.

---

## Environment variables

Required for local development (copy `.env.example` → `.env.local`):

| Variable                            | Used by                        |
|-------------------------------------|--------------------------------|
| `DATABASE_URL`                      | Prisma dev database            |
| `TEST_DATABASE_URL`                 | Vitest test database           |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | apps/dashboard, apps/admin     |
| `CLERK_SECRET_KEY`                  | apps/dashboard, apps/admin     |
| `CLERK_WEBHOOK_SECRET`              | apps/dashboard webhook handler |
| `NEXT_PUBLIC_APP_URL`               | apps/web                       |
| `NEXT_PUBLIC_DASHBOARD_URL`         | apps/web (CTA links)           |

`apps/web` has no Clerk dependency — it requires no auth secrets and is the easiest app to run locally.

`apps/dashboard` and `apps/admin` require both a running database and valid Clerk keys before auth-dependent flows work correctly.

**Never hardcode secrets in source files. Never commit real secrets.** Use `.env.local`, platform environment management, or a secrets manager. If blocked by missing secrets, follow the request protocol below.

---

## Deployment and environments

Primary workflow is **local-first development**. No production deployment target is assumed or configured in this repository.

- `apps/web` is the easiest app to run locally — no secrets required beyond `NEXT_PUBLIC_APP_URL`.
- `apps/dashboard` and `apps/admin` require database and Clerk configuration before meaningful use.
- Do not assume production deployment targets, canonical URLs, or environment promotion steps unless explicitly confirmed.

If any task touches deployment, ask the user to confirm:

- Where each app will be deployed (Vercel, self-hosted, other)
- Which environments exist (local, dev, staging, prod) and their promotion rules
- What the canonical URLs are for each environment
- How secrets are provided in each environment (platform env vars, secrets manager, etc.)

**TODO: Production deployment runbook does not yet exist for this repository.**

---

## Production migration rules

Prisma Migrate is the required migration mechanism. Development uses `prisma migrate dev`. Production uses `prisma migrate deploy`.

- **Never run a non-local migration or promotion step without explicit user instruction.**
- Before any migration targeting a non-local environment, stop and confirm:
  - Target environment and connection string
  - Whether a database backup or snapshot has been taken
  - Deployment order (migrate before or after deploying new app code)
- If production migration runbook details are missing, record a TODO and do not invent a procedure.

**TODO: Production migration promotion runbook must be documented before first production deploy.**

---

## Product catalog and seed rules

- Seed data (`prisma/seed.ts`) is for **local/dev/bootstrap usage only** unless explicitly stated otherwise.
- Do not assume the seed is safe to re-run against a production database.
- Before changing seed behaviour or running seeds outside of local dev, ask:
  - Whether the seed is dev-only or authoritative for all environments
  - Whether plans/prices will later be managed from the admin panel or synced from an external billing provider
  - Whether running the seed is idempotent and safe in the target environment
- Prefer non-destructive seed behaviour (upsert over delete+insert) unless the user explicitly requests otherwise.

---

## Ask for missing external inputs before proceeding

**This is a standing rule.** Whenever a task reaches a point where execution depends on external values not present in the repository — secrets, credentials, infrastructure access, environment-specific configuration, or provider decisions — **stop and ask** before proceeding. Do not invent, fake, stub, or silently assume these values unless the user explicitly requests a local placeholder approach.

This applies to, but is not limited to:

- Database connection strings
- Clerk publishable/secret keys and app configuration
- Payment provider API keys and webhook secrets
- Deployment environment variables and canonical URLs
- Storage, analytics, or monitoring credentials
- Domain values, webhook endpoint URLs

### Request format

State what is needed, why, and whether a safe placeholder is possible:

```
Needed to continue:

- [exact variable name or config item]
  Why: [what breaks without it]
  Used by: [app / package / step]
  Placeholder possible: [yes / no — and why]
```

**Examples:**

Database:
```
Needed to continue:

- DATABASE_URL
  Why: required to run Prisma migrations and serve DB-backed routes
  Used by: apps/dashboard, apps/admin, packages/database
  Placeholder possible: yes — if user wants a local Postgres bootstrap
```

Clerk:
```
Needed to continue:

- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  Why: required for Clerk middleware and all auth-protected routes
  Used by: apps/dashboard, apps/admin
  Placeholder possible: no — auth flows cannot work with invalid keys

- CLERK_SECRET_KEY
  Why: required for server-side Clerk calls and webhook verification
  Used by: apps/dashboard, apps/admin
  Placeholder possible: no
```

Payment provider:
```
Needed to continue:

- Payment provider selection (Stripe / Paddle / Lemon Squeezy / iyzico / other)
  Why: required to implement a concrete PaymentProvider beyond NullPaymentProvider
  Used by: packages/billing, apps/dashboard billing routes
  Placeholder possible: yes — keep NullPaymentProvider until user confirms provider and credentials
```
