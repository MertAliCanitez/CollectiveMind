# Repository Structure

## Monorepo Toolchain

| Tool | Role |
|------|------|
| **pnpm workspaces** | Package manager, workspace hoisting, disk-efficient installs |
| **Turborepo** | Task orchestration, remote caching, build pipeline |
| **TypeScript** | All packages and apps use TypeScript strict mode |
| **ESLint** | Lint rules shared via `packages/config/eslint` |
| **Prettier** | Formatting shared via `packages/config/prettier` |

**Why pnpm over npm/yarn?**
pnpm's content-addressable store means each package version is stored once on disk regardless of how many packages depend on it. In a monorepo with many apps sharing Next.js and React, this is a meaningful efficiency. Hoisting behavior is predictable.

**Why Turborepo over Nx?**
Turborepo has a simpler mental model (pipeline JSON, not generators/executors), better Next.js integration, and native Vercel remote cache. Nx is more powerful but that power is unnecessary overhead at v1.

---

## Directory Structure

```
collectivemind/
│
├── apps/
│   ├── web/                    # Public marketing site
│   │   ├── app/                # Next.js App Router
│   │   │   ├── (marketing)/    # Route group: public pages
│   │   │   ├── api/            # API routes (minimal)
│   │   │   └── layout.tsx
│   │   ├── components/         # App-local components
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── dashboard/              # Customer-facing dashboard
│   │   ├── app/
│   │   │   ├── (auth)/         # sign-in, sign-up, onboarding
│   │   │   ├── (protected)/    # dashboard routes (require auth + org)
│   │   │   │   ├── dashboard/
│   │   │   │   └── settings/
│   │   │   └── api/
│   │   │       ├── webhooks/clerk/
│   │   │       └── webhooks/payments/
│   │   ├── components/
│   │   ├── middleware.ts
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── admin/                  # Internal admin panel
│       ├── app/
│       │   ├── (admin)/        # All admin routes
│       │   │   ├── organizations/
│       │   │   ├── users/
│       │   │   ├── products/
│       │   │   ├── plans/
│       │   │   ├── subscriptions/
│       │   │   ├── billing/
│       │   │   └── audit/
│       │   └── api/
│       ├── components/
│       ├── middleware.ts
│       ├── next.config.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── db/                     # Prisma schema + client
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   └── index.ts        # exports PrismaClient singleton
│   │   └── package.json
│   │
│   ├── auth/                   # Clerk wrappers + role utilities
│   │   ├── src/
│   │   │   ├── middleware.ts   # Shared middleware helpers
│   │   │   ├── roles.ts        # Role check functions
│   │   │   ├── sync.ts         # Clerk → DB sync handlers
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── billing/                # Billing domain
│   │   ├── src/
│   │   │   ├── providers/
│   │   │   │   ├── interface.ts        # PaymentProvider interface
│   │   │   │   ├── null.provider.ts    # No-op (v1 default)
│   │   │   │   └── factory.ts          # getPaymentProvider()
│   │   │   ├── entitlements.ts         # checkEntitlement()
│   │   │   ├── subscriptions.ts        # subscription state machine
│   │   │   ├── plans.ts                # plan queries
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── ui/                     # Shared component library
│   │   ├── src/
│   │   │   ├── components/     # Button, Card, Dialog, Table, etc.
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   ├── email/                  # Transactional email templates
│   │   ├── src/
│   │   │   ├── templates/      # React Email templates
│   │   │   └── index.ts        # send() wrapper
│   │   └── package.json
│   │
│   ├── types/                  # Shared TypeScript types + Zod schemas
│   │   ├── src/
│   │   │   ├── billing.ts
│   │   │   ├── organizations.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── utils/                  # Pure utility functions
│   │   ├── src/
│   │   │   ├── currency.ts     # formatCurrency(), centsToDecimal()
│   │   │   ├── dates.ts
│   │   │   ├── slugs.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── config/                 # Shared tooling configs
│       ├── eslint/
│       │   └── index.js
│       ├── typescript/
│       │   ├── base.json
│       │   ├── nextjs.json
│       │   └── library.json
│       ├── tailwind/
│       │   └── base.ts
│       └── package.json
│
├── docs/
│   ├── 01-architecture/        # This directory
│   └── 02-guides/              # Developer how-to guides (future)
│
├── .github/
│   └── workflows/
│       ├── ci.yml              # PR checks
│       ├── deploy-staging.yml  # Staging deploy on merge to develop
│       └── deploy-production.yml # Production deploy on merge to main
│
├── turbo.json                  # Turborepo pipeline config
├── pnpm-workspace.yaml
├── package.json                # Root: scripts only, no deps
├── .env.example
└── .gitignore
```

---

## Turborepo Pipeline

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build", "db#generate"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "db#generate": {
      "cache": false
    },
    "db#migrate": {
      "cache": false
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^type-check", "db#generate"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

**Key design decisions:**
- `build` depends on `db#generate`: Prisma client must be generated before any app builds. Prevents the common "PrismaClient not found" CI failure.
- `db#migrate` is never in the `build` pipeline: migrations run as a separate CI step, not as part of build. Running migrations in the build step would fail on read-only build environments.
- `dev` has `persistent: true` and `cache: false`: dev servers must stay running and must not cache output.

---

## Git Branching Workflow

### Branch Model

```
main           ← production-ready, protected
  └── develop  ← integration branch, protected
        ├── feature/TICKET-123-add-billing-portal
        ├── feature/TICKET-456-org-settings-page
        ├── fix/TICKET-789-webhook-signature-validation
        └── chore/update-dependencies
```

### Branch Rules

| Branch | Protection | Deploys to |
|--------|-----------|-----------|
| `main` | Required: PR + 1 review + all CI green + no direct pushes | Production |
| `develop` | Required: PR + all CI green | Staging |
| `feature/*`, `fix/*`, `chore/*` | None | Vercel preview (auto) |

### PR Workflow

1. Create branch from `develop` (not `main`)
2. Push → Vercel creates preview deployment automatically
3. Open PR targeting `develop`
4. CI runs: lint, type-check, test, build
5. Peer review (at least 1 approval)
6. Merge to `develop` → triggers staging deploy
7. After QA on staging: PR from `develop` → `main`
8. Merge to `main` → triggers production deploy + `prisma migrate deploy`

### Why `develop` as integration branch?

Direct merge to `main` from feature branches works for solo developers but breaks down for teams:
- Staging needs a stable integration target that isn't polluted by unfinished features
- `develop` provides a buffer: QA happens on staging, not production
- Emergency hotfixes can branch from `main` directly and merge back to both `main` and `develop`

### Hotfix Flow

```
main
  └── hotfix/TICKET-001-critical-auth-bypass
        → PR to main (reviewed, merged)
        → PR to develop (cherry-pick or merge, no review required)
```

### Commit Convention

Conventional Commits format enforced via `commitlint` + `husky`:

```
feat(billing): add subscription pause endpoint
fix(auth): handle missing orgId in middleware
chore(deps): update prisma to 5.x
docs(architecture): add billing provider abstraction
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`
Scopes: `auth`, `billing`, `admin`, `dashboard`, `web`, `db`, `ui`

This enables automated changelog generation and semantic versioning post-MVP.

---

## CI/CD Pipeline (GitHub Actions)

### PR Check (`ci.yml`) — runs on every PR

```
jobs:
  lint:       pnpm turbo lint
  type-check: pnpm turbo type-check
  test:       pnpm turbo test
  build:      pnpm turbo build
  db-check:   prisma validate + prisma format --check
```

All jobs run in parallel where possible. Build is the slowest and runs last (gated on others).

### Staging Deploy (`deploy-staging.yml`) — runs on merge to `develop`

```
1. pnpm turbo build
2. prisma migrate deploy (against staging DB)
3. Deploy apps/web → Vercel (staging env)
4. Deploy apps/dashboard → Vercel (staging env)
5. Deploy apps/admin → Vercel (staging env)
```

### Production Deploy (`deploy-production.yml`) — runs on merge to `main`

```
1. pnpm turbo build
2. prisma migrate deploy (against production DB) -- MANUAL APPROVAL GATE
3. Deploy apps/web → Vercel (production env)
4. Deploy apps/dashboard → Vercel (production env)
5. Deploy apps/admin → Vercel (production env)
```

The **manual approval gate** before the production migration is intentional. Database migrations in production should always be a conscious action, not automatic. GitHub Environments with required reviewers enforces this.

---

## Local Development Setup

```bash
# Install dependencies
pnpm install

# Start local Postgres
docker compose up -d postgres

# Run migrations + seed
pnpm db:migrate
pnpm db:seed

# Start all apps in dev mode
pnpm dev

# Or start specific app
pnpm --filter dashboard dev
```

`docker-compose.yml` at root provides:
- PostgreSQL 16 on port 5432
- (Post-MVP) Redis on port 6379

`.env.local` (gitignored) template is provided via `.env.example`.
