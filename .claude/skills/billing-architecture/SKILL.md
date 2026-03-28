# Skill: billing-architecture

## Purpose

Implement billing domain features correctly: plan management, subscription lifecycle, entitlement checks, and payment provider abstraction. Ensures billing logic stays in `packages/billing`, is never duplicated in product code, and is ready for live payment integration without architectural changes.

## When to Use

Invoke this skill when:
- Adding or modifying subscription management features
- Implementing entitlement/access checks in product domains
- Creating plan management UI in the admin panel
- Adding a new payment provider adapter (post-MVP)
- Writing billing-related UI in `apps/dashboard`
- Querying subscription state from any part of the codebase

## Architecture Summary

```
packages/billing/
  providers/
    interface.ts          ← PaymentProvider contract
    null.provider.ts      ← v1 default (no-op)
    stripe.provider.ts    ← post-MVP
    factory.ts            ← getPaymentProvider()
  entitlements.ts         ← checkEntitlement() — the main product-facing API
  subscriptions.ts        ← subscription state machine + CRUD
  plans.ts                ← plan queries (public and admin)
  invoices.ts             ← invoice management
  index.ts                ← public exports only
```

**The golden rule:** Product domain code imports from `packages/billing`. Billing code never imports from product domains. The dependency is one-way.

## Rules and Guardrails

**Entitlements:**
- Every product feature gate uses `checkEntitlement()` — never query the `subscriptions` table directly from product code.
- `checkEntitlement()` returns a typed object — never return a raw boolean. The calling code may need the plan or feature value.
- Cache `checkEntitlement()` results within a request (using React's `cache()` for RSC, or a simple Map for Route Handlers) — never call it per-component in a page.

**Subscription state:**
- Subscription state transitions are handled by `packages/billing/subscriptions.ts` — never mutate subscription status directly from a route handler.
- The `NullPaymentProvider` is the correct v1 default — it is not a mock, it's a real implementation that returns safe no-ops.
- `providerSubscriptionId` and `providerCustomerId` are nullable until live payment integration. Do not assume they exist.

**Money:**
- All amounts are stored and handled in **cents** (integers).
- Use `formatCurrency(amountInCents, currency)` from `packages/utils` for display. Never do `price / 100` inline.
- Never use `Float` for amounts in Prisma or TypeScript.

**Plans:**
- Plans have a `status` field. Only `ACTIVE` plans can be subscribed to by new customers.
- `LEGACY` plans are kept for existing subscribers but not shown on pricing pages.
- `DEPRECATED` plans have no active subscribers and exist only for historical invoices.

## Step-by-Step Working Instructions

### Adding an entitlement check to a product feature

```ts
// 1. Import from packages/billing only
import { checkEntitlement } from "@repo/billing"
import { cache } from "react"

// 2. Cache the call at request scope (RSC pattern)
const getEntitlement = cache(async (orgId: string, productSlug: string) => {
  return checkEntitlement({ orgId, productSlug })
})

// 3. In your Server Component
async function ProductFeaturePage({ orgId }: { orgId: string }) {
  const entitlement = await getEntitlement(orgId, "product-a")

  if (!entitlement.hasAccess) {
    return <UpgradePrompt currentPlan={entitlement.plan} />
  }

  // Check a specific feature value
  const maxSeats = parseInt(entitlement.featureValue("max_seats") ?? "5")

  return <Feature maxSeats={maxSeats} />
}
```

### The `checkEntitlement()` implementation

```ts
// packages/billing/src/entitlements.ts
import { db } from "@repo/db"

export type Entitlement = {
  hasAccess: boolean
  plan: { id: string; slug: string; name: string } | null
  featureValue: (key: string) => string | null
}

export async function checkEntitlement(params: {
  orgId: string
  productSlug: string
}): Promise<Entitlement> {
  const subscription = await db.subscription.findFirst({
    where: {
      organizationId: params.orgId,
      status: { in: ["ACTIVE", "TRIALING"] },
      plan: {
        product: { slug: params.productSlug },
      },
    },
    include: {
      plan: {
        include: { features: true, product: true },
      },
    },
  })

  if (!subscription) {
    return {
      hasAccess: false,
      plan: null,
      featureValue: () => null,
    }
  }

  return {
    hasAccess: true,
    plan: {
      id: subscription.plan.id,
      slug: subscription.plan.slug,
      name: subscription.plan.name,
    },
    featureValue: (key: string) => {
      return subscription.plan.features.find(f => f.key === key)?.value ?? null
    },
  }
}
```

### Creating a subscription (admin action, v1)

```ts
// packages/billing/src/subscriptions.ts
import { db } from "@repo/db"

export async function createSubscription(params: {
  organizationId: string
  planId: string
  trialDays?: number
  notes?: string
}) {
  const plan = await db.plan.findUniqueOrThrow({ where: { id: params.planId } })

  const now = new Date()
  const periodEnd = new Date(now)

  if (plan.billingInterval === "MONTH") {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  } else if (plan.billingInterval === "YEAR") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else if (plan.billingInterval === "FREE") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 100) // effectively permanent
  }

  const trialEndsAt = params.trialDays
    ? new Date(now.getTime() + params.trialDays * 24 * 60 * 60 * 1000)
    : null

  return db.subscription.create({
    data: {
      organizationId: params.organizationId,
      planId: params.planId,
      status: params.trialDays ? "TRIALING" : "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      trialEndsAt,
      notes: params.notes,
    },
  })
}
```

### The PaymentProvider interface

```ts
// packages/billing/src/providers/interface.ts

export interface CreateCheckoutParams {
  orgId: string
  planId: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  providerCustomerId?: string
}

export interface CheckoutSession {
  url: string
  sessionId: string
}

export interface ProviderCustomer {
  id: string
  email: string
}

export interface NormalizedSubscription {
  providerSubscriptionId: string
  providerCustomerId: string
  status: "trialing" | "active" | "past_due" | "canceled" | "paused"
  currentPeriodStart: Date
  currentPeriodEnd: Date
  trialEndsAt: Date | null
  cancelAtPeriodEnd: boolean
  // The plan's provider-side price ID (used to look up our plan)
  providerPriceId: string
}

export interface NormalizedInvoice {
  providerInvoiceId: string
  providerSubscriptionId: string
  status: "draft" | "open" | "paid" | "void" | "uncollectible"
  amountDue: number  // cents
  amountPaid: number // cents
  currency: string
  periodStart: Date
  periodEnd: Date
  paidAt: Date | null
}

export type ProviderWebhookEvent =
  | { type: "subscription.created"; data: NormalizedSubscription }
  | { type: "subscription.updated"; data: NormalizedSubscription }
  | { type: "subscription.canceled"; data: NormalizedSubscription }
  | { type: "invoice.paid"; data: NormalizedInvoice }
  | { type: "invoice.payment_failed"; data: NormalizedInvoice }

export interface PaymentProvider {
  createCustomer(params: { orgId: string; email: string; name: string }): Promise<ProviderCustomer>
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutSession>
  createBillingPortalSession(providerCustomerId: string, returnUrl: string): Promise<{ url: string }>
  cancelSubscription(providerSubscriptionId: string, atPeriodEnd: boolean): Promise<void>
  updateSubscription(providerSubscriptionId: string, newProviderPriceId: string): Promise<void>
  pauseSubscription(providerSubscriptionId: string): Promise<void>
  resumeSubscription(providerSubscriptionId: string): Promise<void>
  constructWebhookEvent(payload: string | Buffer, signature: string): Promise<ProviderWebhookEvent>
}
```

### The NullPaymentProvider

```ts
// packages/billing/src/providers/null.provider.ts
import type { PaymentProvider } from "./interface"

export class NullPaymentProvider implements PaymentProvider {
  async createCustomer() {
    return { id: "null_customer", email: "" }
  }
  async createCheckout({ cancelUrl }: { cancelUrl: string }) {
    return { url: cancelUrl + "?provider=not_configured", sessionId: "null" }
  }
  async createBillingPortalSession(_: string, returnUrl: string) {
    return { url: returnUrl }
  }
  async cancelSubscription() {}
  async updateSubscription() {}
  async pauseSubscription() {}
  async resumeSubscription() {}
  async constructWebhookEvent() {
    throw new Error("NullPaymentProvider cannot handle webhooks")
  }
}
```

### Adding a new provider (post-MVP pattern)

```ts
// packages/billing/src/providers/stripe.provider.ts
import Stripe from "stripe"
import type { PaymentProvider, NormalizedSubscription } from "./interface"

export class StripeProvider implements PaymentProvider {
  private stripe: Stripe

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, { apiVersion: "2024-04-10" })
  }

  async createCheckout(params) {
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer: params.providerCustomerId,
      customer_email: !params.providerCustomerId ? params.customerEmail : undefined,
      line_items: [{ price: params.planProviderPriceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { orgId: params.orgId, planId: params.planId },
    })
    return { url: session.url!, sessionId: session.id }
  }

  async constructWebhookEvent(payload, signature) {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    return this.normalizeEvent(event)
  }

  private normalizeEvent(event: Stripe.Event): ProviderWebhookEvent {
    // Map Stripe event types to normalized types
    // ...
  }
}
```

## Project-Specific Conventions

### Plan slugs

Plan slugs follow the pattern `{product-slug}:{plan-name}`, all lowercase:
- `product-a:free`
- `product-a:pro`
- `product-a:enterprise`

This makes `checkEntitlement` results unambiguous and allows querying by partial slug prefix.

### Feature keys

Use snake_case for feature keys. Prefix with domain when needed:

```
max_seats
api_access
storage_gb
export_csv
priority_support
custom_domain
sso_saml
```

### Free plan auto-subscription

When an organization is created (via the Clerk webhook sync), automatically create a `FREE` subscription for each product that has a free plan:

```ts
// packages/auth/src/sync.ts — in the organization.created handler
const freePlans = await db.plan.findMany({
  where: { billingInterval: "FREE", status: "ACTIVE" }
})
for (const plan of freePlans) {
  await createSubscription({ organizationId: org.id, planId: plan.id })
}
```

### Billing audit log

Every subscription state change writes to `AuditLog`:

```ts
await db.auditLog.create({
  data: {
    actorUserId: actorUserId ?? null,
    actorType: actorUserId ? "USER" : "SYSTEM",
    organizationId,
    action: "subscription.created",
    resourceType: "Subscription",
    resourceId: subscription.id,
    metadata: { planSlug: plan.slug, trialDays },
  }
})
```
