# Platform Architecture

## 1. Product Definition

**CollectiveMind** is a multi-product B2B SaaS platform that delivers a suite of focused productivity and intelligence tools under one brand. All products share a unified identity, authentication, billing, and organization layer — but each product has isolated domain logic, its own pricing plans, and can be independently accessed or licensed.

### Design Philosophy

- **One account, many products.** A user signs in once and can access every product their organization has an active subscription or access grant for.
- **Organization-first.** Every subscription, access grant, and billing event is owned by an organization, not an individual. Individuals are members of organizations.
- **Loose product coupling.** Products share infrastructure (auth, DB, billing abstraction, UI kit) but do not share domain logic. Adding or removing a product does not break others.
- **Deferred complexity.** Live payment processing, advanced analytics, and global compliance are explicitly deferred to post-MVP. The architecture supports them without implementing them.

---

## 2. User Types and Roles

### Platform-Level Roles (managed in Clerk `publicMetadata`)

Canonical name | Clerk value | Description
--- | --- | ---
`platform_super_admin` | `"super_admin"` | Internal staff. Full access to admin panel, can manage all orgs, plans, subscriptions, and access grants.
`platform_support` | `"support"` | Internal read-only staff. Can view org and subscription state. Cannot modify.

### Organization-Level Roles (Clerk Organizations)

Canonical name | Clerk value | Description
--- | --- | ---
`customer_owner` | `"org:admin"` | Can manage org settings, invite/remove members, manage billing and subscriptions, and manage org-level account settings.
`customer_billing_manager` | `"org:billing_manager"` | Can manage billing and subscriptions only. Cannot manage org members or product settings.
`customer_member` | `"org:member"` | Standard org member. No admin or billing capabilities.

> **Critical distinction:** Organization roles govern *account management permissions* (who can invite members, who can change billing). They do **not** grant product access. A `customer_owner` does not automatically see or use all products on the platform — they can only access products the organization has an active **Subscription** or **AccessGrant** for.

### Product Access Model

Product access is entirely **subscription- and grant-driven**, not role-driven:

| Access path | Description |
| ----------- | ----------- |
| **Subscription** | The organization has an active (or trialing) subscription to a plan for a given product. Standard commercial path. |
| **AccessGrant** | Staff has explicitly granted the organization direct access to a product, outside the subscription flow. Used for trials, complimentary access, onboarding, or legacy migration. |

`checkEntitlement({ orgId, productSlug })` checks both paths. An active `AccessGrant` takes precedence if present.

The customer portal (`apps/dashboard`) must **only** surface products the organization has access to via one of these two paths. It must **never** enumerate all platform products and show them as locked/unavailable based on the user's role.

### Role Design Rationale

- Clerk's built-in `org:admin` / `org:member` system is the implementation layer. The canonical platform names (`customer_owner`, `customer_member`, `customer_billing_manager`) are used in documentation and ADRs to avoid tight coupling to Clerk's naming.
- Platform-level roles are stored in Clerk `publicMetadata` (server-side, tamper-proof) rather than as Clerk org roles, because they apply across all organizations and are held by internal staff, not customers.
- There is no product-level role. Product access is derived exclusively from the organization's active subscriptions and access grants.

---

## 3. Domain Boundaries

The platform is structured as a **modular monolith**. All domains live in one deployable unit at v1, but are organized with explicit boundaries so they can be extracted to separate services later.

```
┌─────────────────────────────────────────────────────────┐
│                     Platform Boundary                   │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Auth   │  │  Billing │  │   Admin  │  Core Domains│
│  │ (Clerk)  │  │ (Abstract│  │  (Internal│              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Orgs    │  │  Users   │  │  Products│  Shared Model│
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│  ┌──────────────────────────────────────────┐          │
│  │           Product Domains                │          │
│  │  [Product A]   [Product B]   [Product N] │          │
│  └──────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

### Domain Responsibilities

| Domain            | Owns                                                             | Does Not Own                                                     |
| ----------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Auth**          | Identity, sessions, org membership, JWT                          | Authorization decisions (belongs to each domain)                 |
| **Billing**       | Plans, subscriptions, invoices, payment provider abstraction     | Product feature logic, user management                           |
| **Organizations** | Org metadata, member roles, settings                             | Billing state (references billing domain)                        |
| **Products**      | Product catalog, feature flags per plan, product-specific config | User identity, payment processing                                |
| **Admin**         | Internal views and controls across all domains                   | No exclusive data ownership — reads/writes through other domains |
| **Audit**         | Immutable log of all cross-domain actions                        | No write side effects                                            |

### Anti-Patterns Avoided

- **God domain**: The `Admin` domain does not own data — it aggregates views and delegates writes.
- **Billing in Product**: Product domains check entitlements but do not handle subscription state.
- **Auth everywhere**: Only the `Auth` domain calls Clerk directly. Other domains receive identity via request context.

---

## 4. Information Architecture

### Public Surface (Marketing Site — `apps/web`)

```
/                          → Platform homepage, product listing
/products/[slug]           → Individual product landing page
/pricing                   → Plan comparison across products
/blog                      → Content marketing
/docs                      → Public documentation
/changelog                 → Release notes
/about, /contact, /legal   → Company pages
```

### Customer Portal (`apps/dashboard` — `(dashboard)` route group)

```
/sign-in, /sign-up         → Clerk-hosted or embedded auth
/org-select                → Org selector (Clerk Organizations)

/home                      → Overview: active products, org summary
/products                  → Products the org has an active subscription or access grant for
/products/[slug]           → Per-product workspace (entitlement-gated)

/billing                   → Active subscriptions and grant status
/settings                  → Org profile, members, personal account (Clerk)
```

### Internal Operations Panel (`apps/dashboard` — `(admin)` route group)

> **v1 decision:** The internal admin panel lives inside `apps/dashboard`, not in `apps/admin`.
> Access is enforced by `requirePlatformStaff()` / `requirePlatformAdmin()` in `apps/dashboard/lib/auth.ts`.
> `apps/admin` is a deferred placeholder for a future dedicated deployment.

```
/admin                     → Redirects to /admin/products
/admin/products            → Product catalog management (create, edit, status, sort)
/admin/products/[id]       → Edit product + manage plans
/admin/products/[id]/plans/[planId] → Edit plan + features
/admin/organizations       → All orgs: search, filter, member/subscription/grant counts
/admin/organizations/[id]  → Org detail: members, subscriptions, access grants
/admin/grants              → All access grants: create, revoke, filter
/admin/grants/new          → Create access grant for an org
/admin/audit               → Platform-wide audit log with filters

Planned (not yet implemented):
/admin/organizations/[id]/subscriptions/new → Create subscription for org
/admin/analytics           → Internal KPIs: ARR/MRR, customer count, product popularity
```

---

## 5. Monorepo Architecture

**Turborepo** is chosen as the monorepo build system.

**Why Turborepo over alternatives:**

- Native support for Next.js incremental builds with remote caching
- Task pipeline definition (`build` depends on `db:generate`) prevents broken deploys
- Works well with `pnpm` workspaces (best-in-class disk efficiency for monorepos)
- Simpler mental model than Nx for teams not using Angular
- First-class Vercel integration for deployment

**Why monorepo over polyrepo:**

- Shared packages (`db`, `ui`, `auth`) must be in sync — monorepo enforces this
- Single PR workflow for cross-domain changes
- Unified CI/CD pipeline
- Easier to onboard contributors

**Why modular monolith over microservices at v1:**

- Microservices introduce distributed systems complexity (network failures, distributed transactions, service discovery) that is not justified at early stage
- A well-bounded modular monolith can be split later when scale demands it
- Clerk handles the hardest distributed concern (auth) as a managed service

---

## 6. App and Package Boundaries

### Applications

| App              | Purpose                                                      | Port |
| ---------------- | ------------------------------------------------------------ | ---- |
| `apps/web`       | Public marketing site                                        | 3000 |
| `apps/dashboard` | Customer portal (`(dashboard)`) + internal ops panel (`(admin)`) | 3001 |
| `apps/admin`     | **Deferred placeholder.** Not the v1 admin implementation target. Reserved for future deployment separation if needed. | 3002 |

`apps/dashboard` serves two distinct audiences separated by Next.js route groups:
- `(dashboard)` — customer-facing portal, access gated by `requireOrg()` + `checkEntitlement()`
- `(admin)` — internal company-only operations, gated by `requirePlatformStaff()` / `requirePlatformAdmin()`

These route groups share the same Next.js process and database connection but have separate layouts, nav components, and auth helpers. They do not share components or data-fetching logic.

All apps are **Next.js 14+ with App Router**. This enables:

- React Server Components for data-heavy pages (no client-side fetch waterfalls)
- Route Handlers as lightweight API endpoints (avoids separate Express API)
- Middleware for auth enforcement at the edge

### Packages

| Package            | Purpose                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `packages/db`      | Prisma schema, generated client, migration tooling                 |
| `packages/auth`    | Clerk client wrappers, middleware helpers, role utilities          |
| `packages/billing` | Billing domain: plan types, subscription logic, provider interface |
| `packages/ui`      | Shared component library (Radix UI + Tailwind)                     |
| `packages/email`   | Transactional email templates (React Email)                        |
| `packages/config`  | Shared ESLint, TypeScript, Tailwind configs                        |
| `packages/types`   | Shared TypeScript types and Zod schemas                            |
| `packages/utils`   | Pure utility functions (formatting, slugs, dates)                  |

### Dependency Rules

```
apps/*     → can import any package
packages/* → can import packages/config, packages/types, packages/utils only
packages/db       → no dependency on other packages (base layer)
packages/auth     → can import packages/db (for user sync)
packages/billing  → can import packages/db
packages/ui       → no dependency on packages/db or packages/auth
```

Enforcing this with ESLint `import/no-restricted-paths` prevents circular dependencies and keeps the base packages clean.

---

## 13. Environment Strategy

### Environment Tiers

| Environment  | Purpose                 | Database                            | Clerk Instance            |
| ------------ | ----------------------- | ----------------------------------- | ------------------------- |
| `local`      | Developer machine       | Local PostgreSQL (Docker)           | Clerk dev instance        |
| `preview`    | Per-PR Vercel preview   | Shared staging DB (separate schema) | Clerk dev instance        |
| `staging`    | Integration testing, QA | Dedicated staging DB                | Clerk staging instance    |
| `production` | Live system             | Production DB (managed, HA)         | Clerk production instance |

### Environment Variable Strategy

All environment variables follow a strict naming convention:

```
CLERK_SECRET_KEY          # Server-only
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  # Client-safe
DATABASE_URL              # Server-only, never exposed to client
NEXT_PUBLIC_APP_URL       # Client-safe
```

Variables are grouped by tier in `.env.local` (gitignored), with `.env.example` committed as documentation. Production variables are injected by the deployment platform (Vercel), never stored in the repo.

### Database per Environment

- **Local**: Docker Compose PostgreSQL, `prisma migrate dev`
- **Staging**: Managed PostgreSQL (e.g., Neon, Supabase, or RDS), `prisma migrate deploy` in CI
- **Production**: Managed PostgreSQL with connection pooling (PgBouncer/Neon serverless), read replica for admin queries

---

## 14. Observability Strategy

### Three Pillars

**Logs**

- Structured JSON logging in all server-side code
- Log levels: `debug` (local only), `info`, `warn`, `error`
- Log fields: `requestId`, `userId`, `orgId`, `productSlug`, `durationMs`
- Shipping target: Axiom or Datadog (v1: `console.log` with structured format, ready to plug in)

**Metrics**

- Application metrics tracked via custom events to an analytics provider
- Key business metrics: signups, org creations, subscription activations, product activations
- Infrastructure metrics: DB connection pool, response times, error rates
- Target: Vercel Analytics (built-in) + optional Prometheus/Grafana post-MVP

**Traces**

- OpenTelemetry instrumentation in Next.js via `@vercel/otel`
- Trace context propagated via request headers
- Useful for debugging slow DB queries and auth middleware overhead
- Target: Vercel Observability dashboard or Jaeger post-MVP

### Audit Trail

All significant user and system actions are recorded in an `AuditLog` table (see `data-model.md`). This is separate from application logs — it is a business record, not a diagnostic tool.

---

## 16. MVP vs Post-MVP Scope

### MVP (v1)

**Included:**

- Public marketing site with product pages and pricing
- User sign-up and sign-in via Clerk
- Clerk Organizations for B2B teams
- Organization creation and member invitation
- Product catalog (2–3 products)
- Plan/pricing data model (no live payment)
- Subscription state management (manual or free tier only)
- Customer dashboard: product access, org settings, member management
- Admin panel: org management, user lookup, subscription state
- Full database schema with Prisma Migrate
- Payment provider abstraction layer (no live provider)
- Git workflow, CI/CD pipeline, environment setup
- Structured logging and audit trail

**Excluded from MVP:**

- Live payment checkout (Stripe/Paddle/etc.)
- Webhook handling from payment providers
- Metered/usage-based billing
- Invoice PDF generation
- Public API / developer API keys
- Advanced analytics dashboard
- Multi-language / i18n
- SAML SSO
- Audit log export
- Email notification system (beyond Clerk's built-in)

### Post-MVP Priority Order

1. Live payment integration (one provider, likely Stripe first)
2. Subscription upgrade/downgrade flows
3. Invoice management and PDF generation
4. Email notifications (welcome, invoice, trial expiry)
5. Public developer API with API key management
6. SAML SSO (enterprise tier requirement)
7. Usage-based billing metering
8. Multi-language support
9. Advanced analytics (cohort, churn, MRR)
