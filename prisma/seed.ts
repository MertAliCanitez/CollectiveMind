/**
 * Development seed script.
 * Run with: pnpm db:seed
 *
 * All operations are idempotent (upsert). Safe to run multiple times.
 * Do NOT run this in production — it creates test data with fixed Clerk IDs.
 *
 * Products seeded:
 *   Insights  — team analytics platform (ACTIVE)
 *   Connect   — API integration platform (ACTIVE)
 *   Workspace — team collaboration suite (COMING_SOON)
 */
import { PrismaClient, BillingInterval, PlanStatus, ProductStatus } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // ─── Products ──────────────────────────────────────────────────────────────

  const insights = await db.product.upsert({
    where: { slug: "insights" },
    update: { name: "Insights", description: "Team analytics and reporting platform." },
    create: {
      slug: "insights",
      name: "Insights",
      description: "Team analytics and reporting platform.",
      status: ProductStatus.ACTIVE,
      sortOrder: 1,
    },
  })

  const connect = await db.product.upsert({
    where: { slug: "connect" },
    update: { name: "Connect", description: "Managed API and webhook integration layer." },
    create: {
      slug: "connect",
      name: "Connect",
      description: "Managed API and webhook integration layer.",
      status: ProductStatus.ACTIVE,
      sortOrder: 2,
    },
  })

  const workspace = await db.product.upsert({
    where: { slug: "workspace" },
    update: { name: "Workspace", description: "Team collaboration suite." },
    create: {
      slug: "workspace",
      name: "Workspace",
      description: "Team collaboration suite.",
      status: ProductStatus.COMING_SOON,
      sortOrder: 3,
    },
  })

  console.log(`  ✓ Products: ${insights.name}, ${connect.name}, ${workspace.name}`)

  // ─── Insights plans ────────────────────────────────────────────────────────
  // Feature keys: max_seats, reports_per_month, data_retention_days,
  //               custom_dashboards, api_access, priority_support, sso_saml, white_label

  const insightsFree = await db.plan.upsert({
    where: { slug: "insights:free" },
    update: {},
    create: {
      productId: insights.id,
      name: "Free",
      slug: "insights:free",
      description: "For individuals and small teams getting started.",
      billingInterval: BillingInterval.FREE,
      displayPrice: 0,
      currency: "USD",
      isPublic: true,
      status: PlanStatus.ACTIVE,
      sortOrder: 1,
      features: {
        create: [
          { key: "max_seats", value: "3" },
          { key: "reports_per_month", value: "10" },
          { key: "data_retention_days", value: "30" },
          { key: "custom_dashboards", value: "false" },
          { key: "api_access", value: "false" },
          { key: "priority_support", value: "false" },
          { key: "sso_saml", value: "false" },
          { key: "white_label", value: "false" },
        ],
      },
    },
  })

  const insightsPro = await db.plan.upsert({
    where: { slug: "insights:pro" },
    update: {},
    create: {
      productId: insights.id,
      name: "Pro",
      slug: "insights:pro",
      description: "For growing teams that run on data.",
      billingInterval: BillingInterval.MONTH,
      displayPrice: 4900, // $49.00/month
      currency: "USD",
      isPublic: true,
      status: PlanStatus.ACTIVE,
      sortOrder: 2,
      features: {
        create: [
          { key: "max_seats", value: "25" },
          { key: "reports_per_month", value: "unlimited" },
          { key: "data_retention_days", value: "365" },
          { key: "custom_dashboards", value: "true" },
          { key: "api_access", value: "true" },
          { key: "priority_support", value: "false" },
          { key: "sso_saml", value: "false" },
          { key: "white_label", value: "false" },
        ],
      },
    },
  })

  const insightsEnterprise = await db.plan.upsert({
    where: { slug: "insights:enterprise" },
    update: {},
    create: {
      productId: insights.id,
      name: "Enterprise",
      slug: "insights:enterprise",
      description: "For organizations that need full control and compliance.",
      billingInterval: BillingInterval.YEAR,
      displayPrice: 49900, // $499.00/year
      currency: "USD",
      isPublic: true,
      status: PlanStatus.ACTIVE,
      sortOrder: 3,
      features: {
        create: [
          { key: "max_seats", value: "unlimited" },
          { key: "reports_per_month", value: "unlimited" },
          { key: "data_retention_days", value: "custom" },
          { key: "custom_dashboards", value: "true" },
          { key: "api_access", value: "true" },
          { key: "priority_support", value: "true" },
          { key: "sso_saml", value: "true" },
          { key: "white_label", value: "true" },
        ],
      },
    },
  })

  console.log(
    `  ✓ Insights plans: ${insightsFree.name}, ${insightsPro.name}, ${insightsEnterprise.name}`,
  )

  // ─── Connect plans ─────────────────────────────────────────────────────────
  // Feature keys: api_calls_per_month, webhooks, max_connections,
  //               rate_limit_tier, dedicated_infra, sla_uptime, priority_support

  const connectStarter = await db.plan.upsert({
    where: { slug: "connect:starter" },
    update: {},
    create: {
      productId: connect.id,
      name: "Starter",
      slug: "connect:starter",
      description: "Explore the platform with no commitment.",
      billingInterval: BillingInterval.FREE,
      displayPrice: 0,
      currency: "USD",
      isPublic: true,
      status: PlanStatus.ACTIVE,
      sortOrder: 1,
      features: {
        create: [
          { key: "api_calls_per_month", value: "10000" },
          { key: "webhooks", value: "3" },
          { key: "max_connections", value: "3" },
          { key: "rate_limit_tier", value: "standard" },
          { key: "dedicated_infra", value: "false" },
          { key: "sla_uptime", value: "false" },
          { key: "priority_support", value: "false" },
        ],
      },
    },
  })

  const connectGrowth = await db.plan.upsert({
    where: { slug: "connect:growth" },
    update: {},
    create: {
      productId: connect.id,
      name: "Growth",
      slug: "connect:growth",
      description: "For teams shipping integrations at scale.",
      billingInterval: BillingInterval.MONTH,
      displayPrice: 9900, // $99.00/month
      currency: "USD",
      isPublic: true,
      status: PlanStatus.ACTIVE,
      sortOrder: 2,
      features: {
        create: [
          { key: "api_calls_per_month", value: "500000" },
          { key: "webhooks", value: "unlimited" },
          { key: "max_connections", value: "25" },
          { key: "rate_limit_tier", value: "elevated" },
          { key: "dedicated_infra", value: "false" },
          { key: "sla_uptime", value: "false" },
          { key: "priority_support", value: "true" },
        ],
      },
    },
  })

  const connectScale = await db.plan.upsert({
    where: { slug: "connect:scale" },
    update: {},
    create: {
      productId: connect.id,
      name: "Scale",
      slug: "connect:scale",
      description: "For teams where uptime is non-negotiable.",
      billingInterval: BillingInterval.MONTH,
      displayPrice: 49900, // $499.00/month
      currency: "USD",
      isPublic: true,
      status: PlanStatus.ACTIVE,
      sortOrder: 3,
      features: {
        create: [
          { key: "api_calls_per_month", value: "5000000" },
          { key: "webhooks", value: "unlimited" },
          { key: "max_connections", value: "unlimited" },
          { key: "rate_limit_tier", value: "dedicated" },
          { key: "dedicated_infra", value: "true" },
          { key: "sla_uptime", value: "true" },
          { key: "priority_support", value: "true" },
        ],
      },
    },
  })

  console.log(
    `  ✓ Connect plans: ${connectStarter.name}, ${connectGrowth.name}, ${connectScale.name}`,
  )

  // ─── Test Organization + User ──────────────────────────────────────────────
  // These use fixed Clerk IDs that only exist in a dev Clerk instance.
  // Never run this in production.

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

  // ─── Active subscription: test org on Insights Pro ────────────────────────
  // Manually-managed (NullPaymentProvider) subscription with a sentinel ID.
  // providerSubscriptionId is the upsert key.

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  await db.subscription.upsert({
    where: { providerSubscriptionId: "sub_seed_test_001" },
    update: {},
    create: {
      organizationId: testOrg.id,
      planId: insightsPro.id,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      providerSubscriptionId: "sub_seed_test_001",
      notes: "Seed data — manual test subscription (Insights Pro)",
    },
  })

  console.log(`  ✓ Active Insights Pro subscription for ${testOrg.name}`)

  // ─── AccessGrant: test org → Workspace (COMING_SOON) ──────────────────────
  // Demonstrates the AccessGrant path: direct product access without a plan.
  // Used to grant beta access to a product that has no active subscription plans yet.

  await db.accessGrant.upsert({
    where: { id: "ag_seed_test_001" },
    update: {},
    create: {
      id: "ag_seed_test_001",
      organizationId: testOrg.id,
      productId: workspace.id,
      reason: "Seed data — beta access grant for test org (Workspace preview)",
    },
  })

  console.log(`  ✓ Beta AccessGrant: ${testOrg.name} → ${workspace.name}`)
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
