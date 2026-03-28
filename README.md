# CollectiveMind

Multi-product B2B SaaS platform. One account, one dashboard, multiple products.

## Stack

| Layer     | Technology                  |
| --------- | --------------------------- |
| Monorepo  | Turborepo + pnpm workspaces |
| Framework | Next.js 15 (App Router)     |
| Language  | TypeScript 5.7 (strict)     |
| Auth      | Clerk (Organizations)       |
| Database  | PostgreSQL + Prisma         |
| Styling   | Tailwind CSS + shadcn/ui    |
| Testing   | Vitest + Playwright         |
| CI/CD     | GitHub Actions + Vercel     |

## Repository Structure

```
apps/
  web/          → Public marketing site       (port 3000)
  admin/        → Internal admin panel        (port 3002)
packages/
  database/     → Prisma client + DB helpers
  auth/         → Clerk wrappers + role checks
  billing/      → Billing domain + provider abstraction
  ui/           → Shared component library (shadcn/ui)
  shared/       → Types, utils, logger
  config/       → ESLint, TypeScript, Tailwind, Prettier configs
  testing/      → Vitest setup + test helpers
prisma/
  schema.prisma → Database schema
  seed.ts       → Development seed data
docs/
  01-architecture/ → Technical architecture docs
  05-prompts/      → Claude Code skill system
content/
  blog/         → Blog post content (MDX)
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local PostgreSQL)

### Setup

```bash
# Install dependencies
pnpm install

# Start local database
docker compose up -d

# Generate Prisma client
pnpm db:generate

# Run migrations + seed
pnpm db:migrate
pnpm db:seed

# Start all apps in development mode
pnpm dev

# Or start a specific app
pnpm --filter @repo/web dev
pnpm --filter @repo/admin dev
```

### Available Commands

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `pnpm dev`        | Start all apps in dev mode     |
| `pnpm build`      | Build all apps and packages    |
| `pnpm lint`       | Lint all packages              |
| `pnpm type-check` | Type-check all packages        |
| `pnpm test`       | Run all tests                  |
| `pnpm format`     | Format all files with Prettier |
| `pnpm db:migrate` | Run pending migrations (dev)   |
| `pnpm db:studio`  | Open Prisma Studio             |
| `pnpm db:seed`    | Seed the development database  |

## Architecture

See [`docs/01-architecture/`](docs/01-architecture/) for the full technical blueprint.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values.

Required for local development:

- `DATABASE_URL` — PostgreSQL connection string (Docker provides this)
- `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — from [Clerk dashboard](https://dashboard.clerk.com)
