/**
 * Development seed script.
 * Run with: pnpm db:seed
 *
 * All operations are idempotent (upsert). Safe to run multiple times.
 * Do NOT run this in production — it creates test data with fixed Clerk IDs.
 */
import { PrismaClient, BillingInterval, PlanStatus, ProductStatus } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // ─── Products ──────────────────────────────────────────────────────────────
  const productA = await db.product.upsert({
    where: { slug: "product-a" },
    update: {},
    create: {
      slug: "product-a",
      name: "Product A",
      description: "The first product in the CollectiveMind suite.",
      status: ProductStatus.ACTIVE,
      sortOrder: 1,
    },
  })

  const productB = await db.product.upsert({
    where: { slug: "product-b" },
    update: {},
    create: {
      slug: "product-b",
      name: "Product B",
      description: "The second product in the CollectiveMind suite.",
      status: ProductStatus.COMING_SOON,
      sortOrder: 2,
    },
  })

  console.log(`  ✓ Products: ${productA.name}, ${productB.name}`)

  // ─── Plans for Product A ───────────────────────────────────────────────────
  // displayPrice is the pricing page value (in cents).
  // Price rows (for payment provider integration) are not seeded here.
  const freePlan = await db.plan.upsert({
    where: { slug: "product-a:free" },
    update: {},
    create: {
      productId: productA.id,
      name: "Free",
      slug: "product-a:free",
      billingInterval: BillingInterval.FREE,
      displayPrice: 0,
      currency: "USD",
      isPublic: true,
      status: PlanStatus.ACTIVE,
      sortOrder: 1,
      features: {
        create: [
          { key: "max_seats", value: "3" },
          { key: "api_access", value: "false" },
          { key: "storage_gb", value: "5" },
          { key: "priority_support", value: "false" },
        ],
      },
    },
  })

  const proPlan = await db.plan.upsert({
    where: { slug: "product-a:pro" },
    update: {},
    create: {
      productId: productA.id,
      name: "Pro",
      slug: "product-a:pro",
      billingInterval: BillingInterval.MONTH,
      displayPrice: 4900, // $49.00/month
      currency: "USD",
      isPublic: true,
      status: PlanStatus.ACTIVE,
      sortOrder: 2,
      features: {
        create: [
          { key: "max_seats", value: "25" },
          { key: "api_access", value: "true" },
          { key: "storage_gb", value: "50" },
          { key: "priority_support", value: "true" },
        ],
      },
    },
  })

  const enterprisePlan = await db.plan.upsert({
    where: { slug: "product-a:enterprise" },
    update: {},
    create: {
      productId: productA.id,
      name: "Enterprise",
      slug: "product-a:enterprise",
      billingInterval: BillingInterval.YEAR,
      displayPrice: 99900, // $999.00/year
      currency: "USD",
      isPublic: true,
      status: PlanStatus.ACTIVE,
      sortOrder: 3,
      features: {
        create: [
          { key: "max_seats", value: "unlimited" },
          { key: "api_access", value: "true" },
          { key: "storage_gb", value: "unlimited" },
          { key: "priority_support", value: "true" },
          { key: "sso_saml", value: "true" },
          { key: "custom_domain", value: "true" },
        ],
      },
    },
  })

  console.log(
    `  ✓ Plans: ${freePlan.name}, ${proPlan.name}, ${enterprisePlan.name} for ${productA.name}`,
  )

  // ─── Test Organization + User ──────────────────────────────────────────────
  // These use fixed Clerk IDs that will only exist in a dev Clerk instance.
  const testOrg = await db.organization.upsert({
    where: { slug: "test-org" },
    update: {},
    create: {
      clerkId: "org_test_seed_001",
      name: "Test Organization",
      slug: "test-org",
    },
  })

  const testUser = await db.user.upsert({
    where: { clerkId: "user_test_seed_001" },
    update: {},
    create: {
      clerkId: "user_test_seed_001",
      email: "admin@test-org.local",
      firstName: "Seed",
      lastName: "Admin",
    },
  })

  await db.orgMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: testOrg.id,
        userId: testUser.id,
      },
    },
    update: {},
    create: {
      organizationId: testOrg.id,
      userId: testUser.id,
      role: "ADMIN",
    },
  })

  console.log(`  ✓ Test org: ${testOrg.name} (admin: ${testUser.email})`)

  // ─── Active Pro Subscription for test org ─────────────────────────────────
  // providerSubscriptionId is the upsert key. This is a manually-managed
  // (NullPaymentProvider) subscription with a fixed sentinel ID.
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  await db.subscription.upsert({
    where: { providerSubscriptionId: "sub_seed_test_001" },
    update: {},
    create: {
      organizationId: testOrg.id,
      planId: proPlan.id,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      providerSubscriptionId: "sub_seed_test_001",
      notes: "Seed data — manual test subscription",
    },
  })

  console.log(`  ✓ Active Pro subscription for ${testOrg.name}`)

  // ─── AccessGrant for Product B (COMING_SOON — subscription not available) ─
  // Demonstrates the AccessGrant path: staff grants direct product access
  // without a plan subscription.
  await db.accessGrant.upsert({
    where: { id: "ag_seed_test_001" },
    update: {},
    create: {
      id: "ag_seed_test_001",
      organizationId: testOrg.id,
      productId: productB.id,
      reason: "Seed data — beta access grant for test org",
      // No expiry: permanent until revoked
    },
  })

  console.log(`  ✓ Beta AccessGrant: ${testOrg.name} → ${productB.name}`)
  console.log("\n✅ Seed complete.")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
