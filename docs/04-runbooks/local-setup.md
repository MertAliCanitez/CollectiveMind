# Local Development Setup

Follow these steps in order. Each section has a verification command — run it before moving on.

---

## Prerequisites

| Tool       | Version    | Install                                                                                |
| ---------- | ---------- | -------------------------------------------------------------------------------------- |
| Node.js    | ≥ 20       | [nodejs.org](https://nodejs.org) or `nvm install 20`                                   |
| pnpm       | ≥ 9        | `npm install -g pnpm@9`                                                                |
| PostgreSQL | ≥ 15       | [postgresql.org](https://www.postgresql.org/download/) or `brew install postgresql@15` |
| Git        | any recent | pre-installed on macOS                                                                 |

**Verify:**

```bash
node --version   # v20.x.x
pnpm --version   # 9.x.x
psql --version   # psql (PostgreSQL) 15.x
```

---

## 1. Clone and Install

```bash
git clone https://github.com/MertAliCanitez/CollectiveMind.git
cd CollectiveMind
pnpm install
```

**Verify:**

```bash
ls node_modules/@prisma/client   # should exist
ls node_modules/.bin/eslint       # should exist
```

---

## 2. Database

### Create the database

```bash
createdb collectivemind_dev
```

### Configure environment

Create `apps/dashboard/.env.local` (never commit this file):

```env
# Database
DATABASE_URL="postgresql://localhost:5432/collectivemind_dev"

# Clerk (fill these in after Clerk setup — see step 3)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

Create `apps/admin/.env.local`:

```env
DATABASE_URL="postgresql://localhost:5432/collectivemind_dev"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

Create `apps/web/.env.local`:

```env
DATABASE_URL="postgresql://localhost:5432/collectivemind_dev"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> The root `.env.example` file lists all variables. Copy it as a reference.

### Generate Prisma client

```bash
pnpm db:generate
```

**Verify:** No errors. Should print `✔ Generated Prisma Client`.

### Run migrations

```bash
pnpm db:migrate
```

This runs `prisma migrate dev` which creates the `migrations/` folder and applies the initial schema.

**Verify:**

```bash
psql collectivemind_dev -c "\dt"
# Should list: User, Organization, OrgMember, Product, Plan, PlanFeature,
#              Subscription, Invoice, InvoiceLineItem, AuditLog
```

### Seed the database

```bash
pnpm db:seed
```

**Verify:** Should print confirmation of upserted products, plans, and test org.

---

## 3. Clerk Setup

> If this is your first time, see `docs/02-backlog/next-task.md` for step-by-step Clerk dashboard instructions.

You need:

- A Clerk dev application with Organizations enabled
- A webhook endpoint pointed at your local tunnel (see below)
- The three env vars in `.env.local`

### Local webhook tunnel

Clerk webhooks need a public URL. Use `ngrok` or Clerk's built-in tunnel:

```bash
# Option A: ngrok
ngrok http 3001

# Option B: Clerk CLI tunnel (if available)
# clerk webhook listen --forward-to localhost:3001/api/webhooks/clerk
```

Copy the tunnel URL into your Clerk webhook endpoint config.

---

## 4. Run the Development Servers

Each app runs on its own port:

```bash
pnpm dev
```

This runs all apps in parallel via Turborepo:

| App              | URL                   |
| ---------------- | --------------------- |
| `apps/web`       | http://localhost:3000 |
| `apps/dashboard` | http://localhost:3001 |
| `apps/admin`     | http://localhost:3002 |

To run a single app:

```bash
pnpm --filter @repo/web dev
pnpm --filter @repo/dashboard dev
pnpm --filter @repo/admin dev
```

---

## 5. Verify the Full Stack

```bash
# Lint all packages
pnpm turbo lint

# Type-check all packages
pnpm turbo type-check

# Run tests (requires DB to be running)
pnpm turbo test

# Build all apps
pnpm turbo build
```

All commands should exit 0 on a clean checkout.

---

## Common Issues

### `prisma generate` fails with "Command failed: pnpm add @prisma/client"

The Prisma client has not been generated yet, or `node_modules` is stale.

```bash
rm -rf node_modules
pnpm install
pnpm db:generate
```

### `eslint: command not found`

ESLint binary is not hoisted. Check `.npmrc` has the hoist patterns and reinstall.

```bash
cat .npmrc   # should contain public-hoist-pattern[]=eslint
rm -rf node_modules && pnpm install
```

### Database connection refused

PostgreSQL is not running.

```bash
brew services start postgresql@15
# or
pg_ctl -D /usr/local/var/postgresql@15 start
```

### Port already in use

Kill the process on that port:

```bash
lsof -ti:3001 | xargs kill
```

### TS errors in `packages/database/src/index.ts`

These appear before `prisma generate` has run. Run:

```bash
pnpm db:generate
```

Then restart your TS language server (`Cmd+Shift+P → TypeScript: Restart TS Server` in VS Code).

---

## Prisma Studio

Browse the database in a GUI:

```bash
pnpm db:studio
```

Opens at http://localhost:5555.

---

## Resetting the Database

Wipe and re-seed from scratch:

```bash
psql -c "DROP DATABASE collectivemind_dev; CREATE DATABASE collectivemind_dev;"
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```
