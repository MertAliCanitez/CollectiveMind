# Data Model

## Design Principles

- **PostgreSQL + Prisma** is the only database layer. No Redis, no separate search index at v1 — add them when there is a measured need.
- **All IDs are UUIDs** (`@default(uuid())`). Sequential integer IDs leak record counts to clients and cause merge conflicts when seeding across environments.
- **Soft deletes via `deletedAt`** for entities that must preserve referential history (Users, Organizations, Subscriptions). Hard deletes are used for entities with no audit significance.
- **Clerk IDs are stored alongside internal IDs.** `clerkId` is a unique field on User and Organization — used for webhook sync and auth context mapping.
- **Money is stored as integers in cents.** Never use `Float` for currency. Use `Int` (cents) with an explicit `currency` field.
- **`createdAt` / `updatedAt`** on every table. `updatedAt` uses `@updatedAt` — Prisma manages it automatically.

---

## Schema Overview

```
User ──< OrgMember >── Organization
                           │
                           └──< Subscription >── Plan >── Product
                           │         │
                           │         └──< Invoice >── InvoiceLineItem
                           └──< AuditLog
User ──< AuditLog
```

---

## Full Prisma Schema

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────
// IDENTITY
// ─────────────────────────────────────────

model User {
  id        String   @id @default(uuid())
  clerkId   String   @unique
  email     String   @unique
  firstName String?
  lastName  String?
  avatarUrl String?
  deletedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  memberships OrgMember[]
  auditLogs   AuditLog[]  @relation("AuditLogActor")

  @@index([clerkId])
  @@index([email])
}

model Organization {
  id        String   @id @default(uuid())
  clerkId   String   @unique
  name      String
  slug      String   @unique
  logoUrl   String?
  deletedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  members       OrgMember[]
  subscriptions Subscription[]
  auditLogs     AuditLog[]     @relation("AuditLogOrg")

  @@index([clerkId])
  @@index([slug])
}

model OrgMember {
  id             String   @id @default(uuid())
  organizationId String
  userId         String
  role           OrgRole  @default(MEMBER)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])
  user         User         @relation(fields: [userId], references: [id])

  @@unique([organizationId, userId])
  @@index([organizationId])
  @@index([userId])
}

enum OrgRole {
  ADMIN
  BILLING_MANAGER
  MEMBER
}

// ─────────────────────────────────────────
// PRODUCT CATALOG
// ─────────────────────────────────────────

model Product {
  id          String        @id @default(uuid())
  slug        String        @unique  // e.g., "product-a" — used in URLs and entitlement checks
  name        String
  description String?
  logoUrl     String?
  status      ProductStatus @default(ACTIVE)
  sortOrder   Int           @default(0)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  plans Plan[]

  @@index([slug])
  @@index([status])
}

enum ProductStatus {
  ACTIVE
  COMING_SOON
  DEPRECATED
}

model Plan {
  id              String       @id @default(uuid())
  productId       String
  name            String                        // e.g., "Pro"
  slug            String                        // e.g., "product-a:pro" — globally unique
  description     String?
  billingInterval BillingInterval
  price           Int                           // in cents
  currency        String       @default("USD")  // ISO 4217
  isPublic        Boolean      @default(true)
  status          PlanStatus   @default(ACTIVE)
  sortOrder       Int          @default(0)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  product       Product       @relation(fields: [productId], references: [id])
  features      PlanFeature[]
  subscriptions Subscription[]

  @@unique([slug])
  @@index([productId])
  @@index([status])
}

enum BillingInterval {
  FREE
  MONTH
  YEAR
  ONE_TIME
}

enum PlanStatus {
  ACTIVE
  LEGACY    // existing subscribers keep it, no new signups
  DEPRECATED
}

model PlanFeature {
  id        String   @id @default(uuid())
  planId    String
  key       String   // e.g., "max_seats", "api_access", "storage_gb"
  value     String   // stored as string; parsed by product domain
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  plan Plan @relation(fields: [planId], references: [id])

  @@unique([planId, key])
  @@index([planId])
}

// ─────────────────────────────────────────
// BILLING
// ─────────────────────────────────────────

model Subscription {
  id                     String             @id @default(uuid())
  organizationId         String
  planId                 String
  status                 SubscriptionStatus @default(TRIALING)
  currentPeriodStart     DateTime
  currentPeriodEnd       DateTime
  trialEndsAt            DateTime?
  cancelAtPeriodEnd      Boolean            @default(false)
  canceledAt             DateTime?
  // Payment provider fields (null until live integration)
  providerName           String?            // "stripe" | "paddle" | etc.
  providerSubscriptionId String?            @unique
  providerCustomerId     String?
  // Internal notes (admin-only)
  notes                  String?
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])
  plan         Plan         @relation(fields: [planId], references: [id])
  invoices     Invoice[]

  @@index([organizationId])
  @@index([planId])
  @@index([status])
  @@index([providerSubscriptionId])
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  PAUSED
  CANCELED
}

model Invoice {
  id              String        @id @default(uuid())
  subscriptionId  String
  organizationId  String
  invoiceNumber   String        @unique  // e.g., "INV-2024-0001"
  status          InvoiceStatus @default(DRAFT)
  amountDue       Int           // in cents
  amountPaid      Int           @default(0)
  currency        String        @default("USD")
  periodStart     DateTime
  periodEnd       DateTime
  dueDate         DateTime?
  paidAt          DateTime?
  // Payment provider fields
  providerInvoiceId String?     @unique
  providerPaymentUrl String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  subscription Subscription    @relation(fields: [subscriptionId], references: [id])
  lineItems    InvoiceLineItem[]

  @@index([subscriptionId])
  @@index([organizationId])
  @@index([status])
}

enum InvoiceStatus {
  DRAFT
  OPEN
  PAID
  VOID
  UNCOLLECTIBLE
}

model InvoiceLineItem {
  id          String   @id @default(uuid())
  invoiceId   String
  description String
  quantity    Int      @default(1)
  unitPrice   Int      // in cents
  total       Int      // quantity * unitPrice
  createdAt   DateTime @default(now())

  invoice Invoice @relation(fields: [invoiceId], references: [id])

  @@index([invoiceId])
}

// ─────────────────────────────────────────
// AUDIT
// ─────────────────────────────────────────

model AuditLog {
  id             String   @id @default(uuid())
  // Actor (who did this — null for system actions)
  actorUserId    String?
  actorType      AuditActorType @default(USER)
  // Org context (null for platform-level actions)
  organizationId String?
  // What happened
  action         String   // e.g., "subscription.created", "member.invited"
  resourceType   String   // e.g., "Subscription", "OrgMember"
  resourceId     String?
  // Additional context
  metadata       Json?    // arbitrary key-value pairs
  ipAddress      String?
  userAgent      String?
  createdAt      DateTime @default(now())

  actor        User?         @relation("AuditLogActor", fields: [actorUserId], references: [id])
  organization Organization? @relation("AuditLogOrg", fields: [organizationId], references: [id])

  @@index([actorUserId])
  @@index([organizationId])
  @@index([action])
  @@index([resourceType, resourceId])
  @@index([createdAt])
}

enum AuditActorType {
  USER
  SYSTEM
  ADMIN
}
```

---

## Index Strategy

### Why these indexes?

- `User.clerkId`: webhook sync lookups — called on every Clerk event
- `User.email`: login lookups, admin search
- `Organization.clerkId`: webhook sync, same reason as above
- `Organization.slug`: URL routing, org switcher
- `OrgMember(organizationId, userId)`: unique constraint doubles as the primary lookup index
- `Plan.slug`: entitlement checks use the slug string — must be fast
- `Subscription.organizationId`: the most common billing query (`what plans does this org have?`)
- `Subscription.providerSubscriptionId`: webhook event matching
- `AuditLog.createdAt`: time-range queries in admin panel

Indexes are not added speculatively. Additional indexes should be added based on `EXPLAIN ANALYZE` output on production query patterns.

---

## Migration Strategy

### Principles

- Every schema change is a **Prisma migration** (`prisma migrate dev` locally, `prisma migrate deploy` in CI)
- Migrations are **forward-only** in production. No rollback scripts. Fix forward with a new migration.
- **Never edit a migration file** after it has been applied to any shared environment.
- Breaking changes (column renames, type changes) use a two-phase migration:
  1. Add new column, dual-write (deploy)
  2. Migrate data, remove old column (next deploy)

### Migration Naming Convention

```
YYYYMMDDHHMMSS_descriptive_name
e.g., 20240315120000_add_subscription_pause_fields
```

Turborepo pipeline ensures `db:generate` (Prisma client generation) runs before any app `build` task.

---

## Data Isolation

All queries that return business data are **scoped to `organizationId`**. This is enforced at the domain layer, not just the route layer.

There is no row-level security in PostgreSQL at v1 (it adds complexity and makes Prisma query debugging harder). Instead:

1. `auth()` from Clerk returns `orgId`
2. Domain functions always accept `orgId` as a required parameter
3. Prisma queries always include `where: { organizationId: orgId }`

This pattern must be reviewed in every new domain function. A linting rule or test suite should verify no domain function reads sensitive data without an `organizationId` filter.

---

## Seeding Strategy

`packages/db/prisma/seed.ts` seeds:
- 2–3 `Product` records
- 2–3 `Plan` records per product (Free, Pro, Enterprise)
- `PlanFeature` records for each plan
- 1 test `Organization` + admin `User` + `OrgMember`
- 1 active `Subscription` for the test org

Seeds are idempotent (`upsert` not `create`) so they can be re-run safely.
