# Platform Architecture

## 1. Product Definition

**CollectiveMind** is a multi-product B2B SaaS platform that delivers a suite of focused productivity and intelligence tools under one brand. All products share a unified identity, authentication, billing, and organization layer — but each product has isolated domain logic, its own pricing plans, and can be independently accessed or licensed.

### Design Philosophy

- **One account, many products.** A user signs in once and sees every product their organization has licensed.
- **Organization-first.** Every subscription, access grant, and billing event is owned by an organization, not an individual. Individuals are members of organizations.
- **Loose product coupling.** Products share infrastructure (auth, DB, billing abstraction, UI kit) but do not share domain logic. Adding or removing a product does not break others.
- **Deferred complexity.** Live payment processing, advanced analytics, and global compliance are explicitly deferred to post-MVP. The architecture supports them without implementing them.

---

## 2. User Types and Roles

### Platform-Level Roles (managed in Clerk)

| Role                   | Description                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `platform:super_admin` | Internal staff. Full access to admin panel, can impersonate orgs, manage all plans and subscriptions. Stored in Clerk `publicMetadata`. |
| `platform:support`     | Internal read-only staff. Can view org and subscription state. Cannot modify.                                                           |

### Organization-Level Roles (Clerk Organizations)

| Role          | Description                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| `org:admin`   | Full control over the organization: invite members, manage subscriptions, access all licensed products. |
| `org:billing` | Can manage billing and subscriptions, but not org members or product settings.                          |
| `org:member`  | Can use licensed products. Cannot manage org settings or billing.                                       |

### Role Design Rationale

- Clerk's built-in `org:admin` / `org:member` system is used as the base. A custom `org:billing` role covers the common B2B pattern where a finance contact manages billing but is not a technical admin.
- Platform-level roles are stored in Clerk `publicMetadata` (server-side, tamper-proof) rather than as Clerk organization roles, because they apply across all organizations and are not scoped to a single org.
- There is no "product admin" role at v1. Product-specific permissions are derived from org membership and the organization's active subscription for that product.

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

### Customer Dashboard (`apps/dashboard`)

```
/sign-in, /sign-up         → Clerk-hosted or embedded auth
/onboarding                → Org creation + first product selection

/dashboard                 → Overview: active products, org summary
/dashboard/products        → All licensed products + quick-launch
/dashboard/products/[slug] → Per-product interface (embedded or iframe-out)

/settings/profile          → Personal profile (name, email, avatar)
/settings/organization     → Org name, slug, logo
/settings/members          → Invite / remove org members, assign roles
/settings/billing          → Active plans, invoices, upgrade/downgrade
/settings/billing/[product]→ Per-product subscription management
/settings/security         → Sessions, connected accounts
```

### Admin Panel (`apps/admin`)

```
/                          → Dashboard: key metrics
/organizations             → All orgs: search, filter, view
/organizations/[id]        → Org detail: members, subscriptions, audit log
/users                     → All users across platform
/products                  → Product catalog management
/plans                     → Plan management (create, deprecate, migrate)
/subscriptions             → All subscriptions, bulk actions
/billing                   → Revenue overview, invoice management
/audit                     → Platform-wide audit log
/settings                  → Feature flags, platform config
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

| App              | Purpose                           | Port |
| ---------------- | --------------------------------- | ---- |
| `apps/web`       | Public marketing site             | 3000 |
| `apps/dashboard` | Customer-facing product dashboard | 3001 |
| `apps/admin`     | Internal admin panel              | 3002 |

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
