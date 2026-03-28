# Skill: prisma-migrations

## Purpose

Make PostgreSQL schema changes safely using Prisma Migrate. Covers the full workflow from schema edit to production deployment, including naming conventions, breaking vs non-breaking changes, and migration safety rules.

## When to Use

Invoke this skill when:
- Adding a new table or model to the schema
- Adding a column to an existing table
- Changing a column type, constraints, or defaults
- Adding or removing indexes
- Renaming a model or field
- Seeding new reference data (products, plans)

## Migration Workflow

### The correct sequence for every schema change

```
1. Edit packages/db/prisma/schema.prisma
2. pnpm --filter db migrate:dev --name descriptive_name
   → Prisma generates SQL, applies to local DB, generates client
3. Review the generated SQL in prisma/migrations/TIMESTAMP_name/migration.sql
4. Verify: pnpm --filter db db:seed (if seed needs updating)
5. Commit schema.prisma + migration files + client changes together
6. PR → CI runs prisma validate + prisma format --check
7. Merge → staging: prisma migrate deploy runs automatically
8. Merge to main → production: prisma migrate deploy with manual approval gate
```

**Never:**
- Edit a migration `.sql` file after it has been committed to `develop` or `main`
- Run `prisma migrate dev` on a staging or production database
- Squash migrations by deleting and re-creating them after sharing with others
- Run `prisma migrate reset` on any shared environment

## Rules and Guardrails

### Migration naming convention

```
pnpm --filter db migrate:dev --name <name>
```

Name must describe **what changed**, not why. Use snake_case:

```
add_org_member_invited_at_field
create_api_keys_table
add_plan_trial_days_field
remove_unused_user_phone_column
add_index_subscription_status
change_invoice_amount_to_bigint
```

Do NOT use:
```
fix                    ← too vague
update_schema          ← meaningless
billing_changes        ← too broad
migration_1            ← worthless
```

### Breaking vs non-breaking changes

**Non-breaking (safe to deploy in one step):**
- Adding a new table
- Adding a nullable column
- Adding a column with a default value
- Adding an index
- Making a required column nullable
- Adding a new enum value

**Breaking (requires two-phase migration):**
- Removing a column
- Renaming a column
- Changing a column type (e.g., `String` → `Int`)
- Making a nullable column required (without a default)
- Removing an enum value
- Renaming a table/model

### Two-phase migration pattern for breaking changes

**Phase 1 (deploy first):**
- Add the new column / new name alongside the old one
- Update application code to dual-write to both
- Deploy

**Phase 2 (deploy after Phase 1 is stable):**
- Backfill old column → new column if needed
- Remove the old column
- Remove dual-write from application code
- Deploy

Example — renaming `User.displayName` to `User.name`:

```prisma
// Phase 1 migration: add new column
model User {
  // ...
  displayName  String?   // old — keep temporarily
  name         String?   // new — add now
}
```

```prisma
// Phase 2 migration: remove old column (after all code uses name)
model User {
  // ...
  name  String?
}
```

## Step-by-Step Working Instructions

### Adding a new model

1. Add the model to `packages/db/prisma/schema.prisma`:

```prisma
model ApiKey {
  id             String   @id @default(uuid())
  organizationId String
  name           String
  keyHash        String   @unique  // store hash, never plaintext
  lastUsedAt     DateTime?
  expiresAt      DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
  @@index([keyHash])
}
```

2. Add the relation back-reference to the related model:

```prisma
model Organization {
  // existing fields...
  apiKeys  ApiKey[]
}
```

3. Generate the migration:

```bash
pnpm --filter db migrate:dev --name create_api_keys_table
```

4. Review the generated SQL: `packages/db/prisma/migrations/TIMESTAMP_create_api_keys_table/migration.sql`

5. If the model needs seeded data, update `packages/db/prisma/seed.ts`.

### Adding a column with a default

```prisma
// schema change
model Subscription {
  // ...
  notes  String?  // nullable → safe non-breaking add
  source String   @default("manual")  // has default → safe
}
```

```bash
pnpm --filter db migrate:dev --name add_subscription_source_and_notes
```

### Adding an index to an existing table

```prisma
model AuditLog {
  // existing fields...

  @@index([createdAt])              // add this
  @@index([resourceType, resourceId]) // or this
}
```

```bash
pnpm --filter db migrate:dev --name add_audit_log_indexes
```

**Note:** Adding an index locks the table briefly on small tables. For large production tables (100k+ rows), use `CREATE INDEX CONCURRENTLY` — add a raw SQL migration:

```sql
-- migration.sql (manually written, not generated)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt");
```

### Removing a column (two-phase)

**Phase 1:** Make nullable (if required), stop writing to it in app code:

```prisma
model User {
  phone  String?  // was required, now nullable
}
```

```bash
pnpm --filter db migrate:dev --name make_user_phone_nullable
```

Deploy Phase 1. Verify no queries read `phone`. Then:

**Phase 2:** Remove entirely:

```prisma
model User {
  // phone removed
}
```

```bash
pnpm --filter db migrate:dev --name remove_user_phone_column
```

### Adding a required column to an existing table

You cannot add a `NOT NULL` column without a default to a table that already has rows. Options:

1. **Add with default** (preferred if a sensible default exists):
```prisma
createdBySource  String  @default("clerk_webhook")
```

2. **Add as nullable, backfill, then make required** (two-phase):
```prisma
// Phase 1
createdBySource  String?

// Phase 2 (after backfill SQL runs)
createdBySource  String
```

The Phase 2 migration SQL should include the backfill:
```sql
UPDATE "Subscription" SET "createdBySource" = 'manual' WHERE "createdBySource" IS NULL;
ALTER TABLE "Subscription" ALTER COLUMN "createdBySource" SET NOT NULL;
```

## Seeding Conventions

The seed file (`packages/db/prisma/seed.ts`) must be idempotent — use `upsert`:

```ts
// packages/db/prisma/seed.ts
const productA = await db.product.upsert({
  where: { slug: "product-a" },
  update: { name: "Product A", status: "ACTIVE" },
  create: {
    slug: "product-a",
    name: "Product A",
    description: "...",
    status: "ACTIVE",
    sortOrder: 1,
  },
})

const freePlan = await db.plan.upsert({
  where: { slug: "product-a:free" },
  update: {},
  create: {
    productId: productA.id,
    name: "Free",
    slug: "product-a:free",
    billingInterval: "FREE",
    price: 0,
    currency: "USD",
    isPublic: true,
    status: "ACTIVE",
  },
})
```

## CI Checks

The CI pipeline runs these checks on every PR:

```bash
# Validate schema syntax
pnpm dlx prisma validate --schema packages/db/prisma/schema.prisma

# Check schema is formatted (fails on unformatted schema)
pnpm dlx prisma format --check --schema packages/db/prisma/schema.prisma

# Ensure no drift between schema and migrations
pnpm --filter db migrate:status
```

`migrate:status` fails if there are unapplied migrations or if the schema has changed since the last migration — catching cases where someone edited the schema without generating a migration.

## Environment Matrix

| Environment | Command | When |
|------------|---------|------|
| Local dev | `prisma migrate dev` | Any schema change |
| Local reset | `prisma migrate reset` | Dev only, resets all data |
| Staging | `prisma migrate deploy` | Automated in CI on `develop` merge |
| Production | `prisma migrate deploy` | CI with manual approval gate on `main` merge |

`prisma migrate deploy` never creates new migrations — it only applies pending ones. It is safe to run in CI.
