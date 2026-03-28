# Deployment Runbook

This document covers deploying CollectiveMind to Vercel (preview and production) and managing the production database. It is the authoritative reference for every deployment operation.

---

## Environment Overview

| Environment | Branch                  | Database                        | Clerk Instance      | URL                        |
| ----------- | ----------------------- | ------------------------------- | ------------------- | -------------------------- |
| Local       | any                     | `collectivemind_dev` (local PG) | dev instance        | localhost                  |
| Preview     | any PR branch           | Neon branch (auto)              | dev instance        | Vercel preview URL         |
| Staging     | `main` (manual promote) | Neon staging branch             | staging instance    | staging.collectivemind.com |
| Production  | `main`                  | Neon production                 | production instance | collectivemind.com         |

> **No `develop` branch.** Staging is a manually-promoted deployment of `main`. Vercel projects have separate environments (Preview / Production) — staging is set up as a second Production deployment in its own Vercel project, or via Vercel's environment aliases. See the staging setup section below.

---

## Vercel Projects

Three Vercel projects, one per app:

| App              | Vercel project             | Root directory   |
| ---------------- | -------------------------- | ---------------- |
| `apps/web`       | `collectivemind-web`       | `apps/web`       |
| `apps/dashboard` | `collectivemind-dashboard` | `apps/dashboard` |
| `apps/admin`     | `collectivemind-admin`     | `apps/admin`     |

Each project uses the **same monorepo** — set the root directory in Vercel's project settings, not via separate repos.

Each app has a committed `vercel.json` that specifies the build and install commands. Vercel will read it automatically when the root directory is set correctly. No manual build command entry in the UI is needed.

```json
// Example: apps/dashboard/vercel.json
{
  "framework": "nextjs",
  "buildCommand": "cd ../.. && pnpm turbo build --filter=@repo/dashboard",
  "installCommand": "pnpm install",
  "outputDirectory": ".next"
}
```

### Staging Vercel setup

Staging uses the same three Vercel projects but with a separate **environment** or a separate set of projects (e.g., `collectivemind-dashboard-staging`). Recommended approach:

1. Create three additional Vercel projects (e.g., `collectivemind-web-staging`, etc.) with the same monorepo config
2. Point them at a **Neon staging branch** and a **Clerk staging instance**
3. Deploy to staging by running `vercel --prod` from the `apps/<name>` directory with the staging project selected, or via a dedicated GitHub Actions job that deploys on merge to `main`
4. Keep staging and production environment variables isolated — never share `DATABASE_URL` between environments

---

## Environment Variables

### Required in every Vercel app

| Variable                            | Where to get it                  |
| ----------------------------------- | -------------------------------- |
| `DATABASE_URL`                      | Neon console → Connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys       |
| `CLERK_SECRET_KEY`                  | Clerk dashboard → API Keys       |

### Additional for `apps/dashboard`

| Variable               | Where to get it                            |
| ---------------------- | ------------------------------------------ |
| `CLERK_WEBHOOK_SECRET` | Clerk dashboard → Webhooks → your endpoint |
| `NEXT_PUBLIC_APP_URL`  | Your deployment URL                        |

### Additional for `apps/admin`

| Variable              | Where to get it     |
| --------------------- | ------------------- |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL |

> Never put secrets in `vercel.json` or committed `.env.*` files. Use Vercel's environment variable UI or `vercel env add`.

---

## Database Migrations

### Preview / staging migrations

Migrations run automatically via CI on PR branches if `migrate:deploy` is wired in the CI pipeline. Until then, run manually:

```bash
DATABASE_URL=<preview-url> pnpm db:migrate:deploy
```

### Production migrations

**Never run `prisma migrate dev` in production.** Use `migrate deploy` only:

```bash
DATABASE_URL=<production-url> pnpm db:migrate:deploy
```

Run this **before** deploying the new app version. The two-phase migration pattern (see `docs/01-architecture/data-model.md`) ensures backwards compatibility during the deployment window.

### Verifying a migration

After running, connect and confirm:

```bash
psql <production-url> -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

All migrations should show `applied_steps_count = 1` and no `rolled_back_at`.

---

## Deployment Steps

### Standard feature deployment

```
1. PR is opened → Vercel creates preview deployment automatically
2. CI must be green (lint, format, type-check, prisma-validate, test, build)
3. PR is reviewed and approved
4. If migration is needed: run migrate:deploy against target DB BEFORE merge
5. Merge to main
6. Vercel auto-deploys on merge
7. Verify health check endpoints post-deploy (see Health Checks section)
```

### Manual deploy (emergency / hotfix)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy dashboard to production
cd apps/dashboard
vercel --prod
```

Hotfix flow: branch from main → fix → PR → emergency review → merge → deploy.

---

## Health Checks

After every production deployment, verify:

```bash
# Dashboard
curl https://dashboard.collectivemind.com/api/health
# Expected: {"ok":true,"db":"connected"}

# Admin
curl https://admin.collectivemind.com/api/health
# Expected: {"ok":true,"db":"connected"}
```

> Health check endpoints are live at `/api/health` on dashboard and admin. The web app has no server-side health endpoint (it is a static/SSG app with no DB dependency — uptime monitors should check the root path instead).

---

## Rollback

### App rollback

In the Vercel dashboard: Deployments → find the last good deployment → "Promote to Production".

Or via CLI:

```bash
vercel rollback
```

### Database rollback

Prisma does not support automatic rollback. If a migration must be reverted:

1. Write a new migration that undoes the change (forward-only pattern).
2. If data loss is a risk, take a DB snapshot first.
3. Apply the new migration with `migrate deploy`.
4. Deploy the reverted app code.

---

## Clerk Configuration per Environment

Each environment needs its own Clerk instance to prevent test data from polluting production.

| Env        | Clerk instance      | Webhook URL                                               |
| ---------- | ------------------- | --------------------------------------------------------- |
| Dev        | dev instance        | `localhost:<port>/api/webhooks/clerk` via tunnel          |
| Staging    | staging instance    | `https://staging.collectivemind.com/api/webhooks/clerk`   |
| Production | production instance | `https://dashboard.collectivemind.com/api/webhooks/clerk` |

Clerk webhook must subscribe to: `user.*`, `organization.*`, `organizationMembership.*`

---

## Secrets Rotation

When rotating a secret (Clerk key, DB password, etc.):

1. Add the new value to Vercel env vars alongside the old one.
2. Deploy with both values active (zero-downtime window).
3. Revoke the old secret at the source.
4. Remove the old value from Vercel env vars.
5. Update this doc if the variable name changed.

---

## Monitoring

- **Error monitoring:** Sentry (Phase 4 — not yet configured)
- **Logs:** Vercel Functions logs (dashboard → project → Logs tab)
- **DB metrics:** Neon console

Until Sentry is configured, check Vercel logs after every production deploy.
