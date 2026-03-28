# Prisma Migrations Runbook

This document is the authoritative reference for all database migration work on CollectiveMind. It explains the migration workflow for local development, staging, and production, and provides a step-by-step guide for every common migration scenario.

---

## Core Principle: Two Commands, Two Contexts

Prisma has two migration commands. Understanding when to use each is the most important thing in this document.

| Command                 | When to use                 | What it does                                                                                                |
| ----------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `prisma migrate dev`    | Local development only      | Creates a new migration file, applies it to your local DB, re-generates the client. Runs `seed` if present. |
| `prisma migrate deploy` | Staging and production only | Applies pending migration files without creating new ones. Never resets. Never seeds. Safe for CI/CD.       |

**Never run `migrate dev` against staging or production.**
**Never run `migrate deploy` with no migration files — it will error if no pending migrations exist.**

---

## Schema Location

```
prisma/
  schema.prisma          ← the single source of truth
  seed.ts                ← development seed data (never runs in prod)
  migrations/
    20260328000000_init_schema/
      migration.sql      ← the SQL Prisma applies
    ...                  ← future migrations
```

The schema is at the repo root. All packages reference it via the `prisma.schema` field in `packages/database/package.json`:

```json
"prisma": {
  "schema": "../../prisma/schema.prisma"
}
```

---

## Available Commands

All commands are run from the repo root. They delegate to `packages/database` via pnpm filter.

| Root command             | What it does                                                               |
| ------------------------ | -------------------------------------------------------------------------- |
| `pnpm db:generate`       | Re-generates `@prisma/client` types from the current schema                |
| `pnpm db:migrate`        | Create + apply a new migration in local dev (`migrate dev`)                |
| `pnpm db:migrate:deploy` | Apply pending migrations to staging/production                             |
| `pnpm db:migrate:reset`  | Drop + recreate local DB + re-apply all migrations + seed (**local only**) |
| `pnpm db:migrate:status` | Show which migrations have and haven't been applied                        |
| `pnpm db:studio`         | Open Prisma Studio at localhost:5555                                       |
| `pnpm db:seed`           | Run the seed script against `$DATABASE_URL`                                |
| `pnpm db:validate`       | Validate `schema.prisma` for syntax errors                                 |

---

## Local Development Workflow

### Starting from scratch

```bash
createdb collectivemind_dev
export DATABASE_URL="postgresql://localhost:5432/collectivemind_dev"
pnpm db:migrate   # prompts: "Enter a name for the migration" → type: describe_what_changed
pnpm db:seed
```

### Making a schema change

1. Edit `prisma/schema.prisma`
2. Run `pnpm db:migrate` — Prisma diffs the schema against your local DB and generates a new migration file
3. When prompted, name the migration clearly (see naming conventions below)
4. Commit both the schema change and the generated migration file together

### Resetting your local database

Use this when you want a clean slate (e.g. after pulling migrations from a branch that diverged from yours):

```bash
pnpm db:migrate:reset
```

This drops the database, re-creates it, applies all migrations in order, then runs the seed script. **Only works if `DATABASE_URL` points to a local database.**

### Pulling migrations created by a teammate

```bash
git pull
pnpm db:migrate   # applies any pending migrations; generates nothing if schema is up to date
```

If the schema hasn't changed from your perspective, Prisma will report "Already in sync, no schema changes found." If someone added migrations, they will be applied.

---

## Staging and Production Workflow

### Deploying a migration

```bash
DATABASE_URL="<staging-or-prod-url>" pnpm db:migrate:deploy
```

In CI/CD (GitHub Actions), this runs automatically in the `deploy` job **before** the new app version goes live. The workflow is:

```
1. pnpm db:migrate:deploy   ← apply new migrations against target DB
2. vercel deploy            ← deploy new app code
```

This ordering ensures the DB schema is updated before the code that expects it is live. For backwards-compatibility during the deployment window, follow the two-phase migration pattern described below.

### Checking migration status

```bash
DATABASE_URL="<target-db-url>" pnpm db:migrate:status
```

All applied migrations show `applied_steps_count: 1`. Any unapplied ones appear as `Not applied`. Verify this is clean before and after a production deploy.

---

## Migration Naming Conventions

Use snake_case. Name the migration after what changed, not which model was involved.

```
# Good — describes the intent
add_user_avatar_url
add_product_access_grants
backfill_subscription_status
remove_deprecated_trial_field
add_index_subscriptions_status

# Bad — too vague or too model-centric
update_users
schema_change
migration_1
add_columns
```

When using `pnpm db:migrate`, Prisma prompts: `Enter a name for the new migration`. Type the descriptive name there — do not include a timestamp (Prisma adds one automatically).

---

## Two-Phase Migration Pattern

Use this for any change that could break the running app during the deployment window — i.e. when the old code and new code will briefly run against the same DB.

### Phase 1 (deploy DB change, keep old code running)

- Add new columns as nullable (no `NOT NULL` without a default)
- Add new tables
- Add new indexes
- **Do not** rename columns, remove columns, or change column types yet

### Phase 2 (after new code is fully live)

- Add `NOT NULL` constraints after backfilling the column
- Remove old columns that new code no longer reads
- Rename columns (add new → backfill → remove old, across separate deployments)

**Example: renaming `plan.price` to `plan.displayPrice`**

```
Migration 1: add displayPrice nullable, copy data from price
Migration 2: make displayPrice NOT NULL, drop price column
```

Each phase is a separate migration file and a separate deployment.

---

## Writing Migrations Safely

### Additive changes (low risk)

- Adding a nullable column
- Adding a new table
- Adding an index
- Adding an enum value

These are safe to apply with zero downtime. One migration, one deployment.

### Breaking changes (requires two-phase)

- Renaming a column
- Removing a column that existing code reads
- Changing a column type
- Adding NOT NULL without a default to an existing table with data
- Removing an enum value

### Never do in production

- `DROP TABLE` without a deprecation period
- Changing the type of a column with existing data without a backfill
- Removing a unique constraint that the application depends on

---

## Schema Evolution with Git Branches

The migration history is append-only and tracks in Git. Each branch that includes a schema change gets a new migration file. The key rules:

**Do not edit existing migration files.** Once a migration has been applied anywhere (local, staging, production), treat it as immutable. If you need to fix a mistake, write a new migration.

**Do not squash migration history.** The migration folder is the audit trail for schema changes. Keep all files.

**When two branches both add migrations:**

If branch A and branch B are both created from main and both add a migration:

1. The first branch to merge lands its migration
2. The second branch must rebase on main before merging
3. After rebase, run `pnpm db:migrate` locally — Prisma will either apply the existing migration from the first branch or prompt for a new one if there's a conflict
4. Resolve conflicts in the schema file (not the migration SQL), then re-run `pnpm db:migrate`

---

## Adding `@map` and `@@map` (Table Name Conventions)

All models in this project use snake_case table names via `@@map`. New models must follow this pattern:

```prisma
model MyNewModel {
  id String @id @default(uuid())
  ...

  @@map("my_new_models")
}
```

Prisma model names remain PascalCase (for the generated TypeScript types), but the actual PostgreSQL tables use snake_case.

---

## Inspecting the Migration History

```bash
# See all migrations and their status
pnpm db:migrate:status

# View the raw migration table in psql
psql $DATABASE_URL -c "SELECT migration_name, finished_at, applied_steps_count FROM _prisma_migrations ORDER BY finished_at;"
```

---

## Seed Strategy

The seed script at `prisma/seed.ts` is for development only. It is:

- **Idempotent** — all operations use upsert with stable identifiers
- **Safe to run multiple times** — will not create duplicates
- **Never run in production** — CI runs `migrate:deploy`, not `seed`

The seed creates:

- Products and plans for all products (with display prices and plan features)
- A test organization (`test-org`) with an admin user
- An active Pro subscription for the test org
- An `AccessGrant` for Product B (demonstrates the grant access path)

To add new seed data: edit `prisma/seed.ts`, use upsert, commit alongside the schema change it supports.

---

## When to Regenerate the Client

Run `pnpm db:generate` whenever:

- You edit `prisma/schema.prisma`
- A teammate pushes schema changes and you pull them
- TS types in `packages/database/src/index.ts` show errors for known models

The CI `prisma-validate` job validates the schema syntax. The `build` job depends on `db:generate` running first.

---

## Troubleshooting

### "The migration file has changed since it was applied"

Prisma detected a migration file was edited after being applied. Do not edit migration files. If this was accidental, restore the original file from git history.

### "Migration failed to apply cleanly"

The migration SQL errored against the target DB. Common causes:

- Constraint violation (data exists that violates a new NOT NULL or UNIQUE)
- Type mismatch (column already exists with a different type)

Fix: inspect the error, write a data migration or a two-phase migration, do not re-run the failing one.

### "There are N unapplied migrations"

Run `pnpm db:migrate:deploy` (staging/prod) or `pnpm db:migrate` (local) to apply them.

### TS errors after pulling new migrations

Run `pnpm db:generate` then restart your TypeScript language server.

### Schema drift detected

Prisma reports schema drift when the local DB doesn't match what migrations describe. Usually caused by running `prisma db push` or editing the DB directly. Fix by running `pnpm db:migrate:reset` locally (never in prod — address drift manually with a corrective migration).
