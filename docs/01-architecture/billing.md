# Billing Architecture

## Design Principles

1. **No live payment at v1.** The billing domain is fully designed and the data model exists, but no real money moves until a payment provider is integrated.
2. **Provider-agnostic from day one.** Every interaction with a payment provider goes through an interface. Swapping providers is a configuration change, not an architecture change.
3. **Subscriptions are owned by organizations.** An organization subscribes to a product plan. Users within that org get access as a result of org membership, not individual subscriptions.
4. **Plans are first-class platform data.** Plans are stored in the database, not hardcoded. Changing pricing does not require a code deploy.

---

## Billing Domain Model

### Core Entities

```
Product ──< Plan ──< Subscription >── Organization
                          │
                          └──< Invoice >── InvoiceLineItem
```

### Entity Descriptions

**Product**
A SaaS product offered on the platform. Has a slug (e.g., `product-a`), display name, and status (`active`, `coming_soon`, `deprecated`).

**Plan**
A pricing tier for a specific product. Examples: `product-a:free`, `product-a:pro`, `product-a:enterprise`.

Each plan has:
- `billingInterval`: `month` | `year` | `one_time` | `free`
- `price`: stored in cents, currency-specified
- `currency`: ISO 4217 (e.g., `USD`, `EUR`, `TRY`)
- `isPublic`: whether it appears on the pricing page
- `status`: `active` | `legacy` | `deprecated`
- A set of `PlanFeature` entitlements

**PlanFeature**
Key-value pairs that define what a plan enables. Examples:

```
key: "max_seats"          value: "10"
key: "api_access"         value: "true"
key: "storage_gb"         value: "50"
key: "priority_support"   value: "true"
```

Features are checked by the product domain to gate functionality. This is a flat key-value store by design — complex feature trees create maintenance overhead.

**Subscription**
Links an organization to a plan for a product.

States:
```
trialing → active → past_due → canceled
                 → canceled
trialing → canceled
```

Fields:
- `status`: `trialing` | `active` | `past_due` | `canceled` | `paused`
- `currentPeriodStart` / `currentPeriodEnd`
- `trialEndsAt` (nullable)
- `cancelAtPeriodEnd`: boolean
- `providerSubscriptionId`: the ID from the payment provider (null until live integration)
- `providerCustomerId`: the provider's customer ID for the org (null until live integration)

**Invoice**
A billing record. Created by the platform (v1: manually or seeded) or synced from a payment provider webhook (post-MVP).

- `status`: `draft` | `open` | `paid` | `void` | `uncollectible`
- `amountDue`, `amountPaid`: in cents
- `currency`
- `invoiceNumber`: human-readable (e.g., `INV-2024-0001`)

---

## Subscription Lifecycle

### v1 (No Live Payment)

At v1, subscriptions can be in one of two states:
- **Free**: Created automatically when an org activates a free-tier product.
- **Manual**: Created by a platform admin in the admin panel (for early customers, trials, pilots).

The subscription state machine is fully implemented. The missing piece is the trigger: instead of a payment provider webhook firing `subscription.activated`, a platform admin manually sets the state.

### Post-MVP (Live Payment)

When a payment provider is connected:
1. Customer clicks "Upgrade" in the dashboard
2. Platform calls `PaymentProvider.createCheckout(org, plan)`
3. Provider returns a checkout URL
4. Customer completes payment on provider's hosted page
5. Provider fires `subscription.created` webhook
6. Platform webhook handler calls `BillingService.activateSubscription(providerEvent)`
7. Subscription status updated to `active`

The transition from v1 to post-MVP requires:
- Implementing one `PaymentProvider` adapter (see below)
- Adding a webhook route for that provider
- No changes to the billing domain model

---

## Payment Provider Abstraction Strategy

### The Interface

All payment provider interactions are expressed through a single TypeScript interface in `packages/billing`:

```ts
interface PaymentProvider {
  // Customer management
  createCustomer(org: Organization): Promise<ProviderCustomer>
  getCustomer(providerCustomerId: string): Promise<ProviderCustomer>

  // Checkout
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutSession>
  createBillingPortalSession(providerCustomerId: string): Promise<BillingPortalSession>

  // Subscription management
  cancelSubscription(providerSubscriptionId: string, atPeriodEnd: boolean): Promise<void>
  updateSubscription(providerSubscriptionId: string, newPlanProviderId: string): Promise<void>
  pauseSubscription(providerSubscriptionId: string): Promise<void>
  resumeSubscription(providerSubscriptionId: string): Promise<void>

  // Webhook
  constructWebhookEvent(payload: string | Buffer, signature: string): Promise<ProviderWebhookEvent>
}
```

### The Null Provider (v1)

A `NullPaymentProvider` is the default implementation. It is not a mock — it is a real implementation that does nothing and returns inert values. It allows all billing code paths to execute without errors in environments where no provider is configured.

```ts
class NullPaymentProvider implements PaymentProvider {
  async createCheckout(): Promise<CheckoutSession> {
    return { url: "/settings/billing?status=not_configured", sessionId: "null" }
  }
  // ... all methods return safe no-ops
}
```

This is intentionally different from mocking in tests. The `NullPaymentProvider` runs in production (v1) and staging. It prevents broken UI flows while real integration is pending.

### Provider Adapters (Post-MVP)

Each supported provider is an adapter class implementing `PaymentProvider`:

```
packages/billing/providers/
  null.provider.ts        ← active in v1
  stripe.provider.ts      ← first post-MVP provider
  paddle.provider.ts
  lemon-squeezy.provider.ts
  iyzico.provider.ts
```

The active provider is selected by environment variable:

```
PAYMENT_PROVIDER=stripe
```

`packages/billing` exports a factory:

```ts
export function getPaymentProvider(): PaymentProvider {
  switch (process.env.PAYMENT_PROVIDER) {
    case "stripe": return new StripeProvider(process.env.STRIPE_SECRET_KEY)
    case "paddle": return new PaddleProvider(...)
    default: return new NullPaymentProvider()
  }
}
```

**Why a factory over dependency injection?**
At v1, a factory is simpler and has no runtime overhead. DI frameworks (like InversifyJS) add complexity not justified for a monolith. If the platform grows to multiple services, this factory can be replaced with a proper DI container.

### Webhook Normalization

Each provider sends different event shapes. The adapter normalizes all events into a shared `ProviderWebhookEvent` type:

```ts
type ProviderWebhookEvent =
  | { type: "subscription.created"; data: NormalizedSubscription }
  | { type: "subscription.updated"; data: NormalizedSubscription }
  | { type: "subscription.canceled"; data: NormalizedSubscription }
  | { type: "invoice.paid"; data: NormalizedInvoice }
  | { type: "invoice.payment_failed"; data: NormalizedInvoice }
```

The webhook handler in the dashboard app only deals with `ProviderWebhookEvent` — never with raw Stripe/Paddle events. This ensures that switching providers requires only rewriting the adapter, not the handler.

---

## Entitlement Checking

Product domains check entitlements via a single function in `packages/billing`:

```ts
async function checkEntitlement(params: {
  orgId: string
  productSlug: string
  featureKey?: string
}): Promise<Entitlement>

type Entitlement = {
  hasAccess: boolean
  plan: Plan | null
  featureValue: string | null
}
```

**Usage in a product route:**
```ts
const entitlement = await checkEntitlement({ orgId, productSlug: "product-a" })
if (!entitlement.hasAccess) return <UpgradePrompt />
```

**Why a single function?**
- Keeps product code unaware of subscription implementation details
- Easy to add caching (Redis, in-memory LRU) in one place
- Easy to unit test product components by mocking this single boundary

---

## Pricing Page Strategy

The pricing page reads plans from the database (via a cached server-side fetch). This means:
- Pricing can be updated without a code deploy
- Plans can be toggled public/private by admins
- A/B testing different price points is possible without engineering involvement

**Currency handling:**
Prices are stored in cents as integers. Display formatting is handled by a utility function using `Intl.NumberFormat`. Multi-currency display on the pricing page shows the org's currency if known, otherwise defaults to USD.

---

## Multi-Currency and Global Sales Readiness

The billing model is designed for global sales:

- All prices stored with explicit `currency` field
- Plans can have multiple currency variants (one Plan record per currency, linked to the same `planGroup`)
- Invoices always record the currency at time of billing
- Tax handling is entirely deferred to the payment provider (Stripe Tax, Paddle's automatic tax)

No currency conversion is done by the platform. The provider handles it.

---

## Billing Events and Audit Trail

All billing state changes are recorded in the `AuditLog` with:
- `actor`: the user or system that triggered the change
- `action`: `subscription.created`, `subscription.canceled`, `plan.changed`, etc.
- `resourceType`: `Subscription`, `Invoice`
- `resourceId`: the affected record ID
- `metadata`: relevant context (old plan, new plan, reason)

This provides a complete billing history that does not depend on provider webhook replay.
