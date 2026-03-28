# Billing Architecture Runbook

This document is the authoritative reference for the CollectiveMind billing domain. It covers the architecture, provider abstraction, entitlement model, and the step-by-step guide for integrating a live payment provider.

For the product decisions behind these choices, see `docs/03-decisions/` (ADRs forthcoming).

---

## Architecture Overview

```
Product Domain (e.g. apps/dashboard)
   │
   │  checkEntitlement({ orgId, productSlug })
   ▼
packages/billing            ← billing domain boundary
   │
   ├── entitlements.ts      ← sole access check API
   ├── subscriptions.ts     ← subscription lifecycle (create/cancel/update)
   ├── status.ts            ← UI-facing billing status (getOrgBillingStatus)
   ├── webhooks.ts          ← webhook event processor
   ├── plans.ts             ← plan catalog queries
   └── providers/
       ├── interface.ts     ← PaymentProvider contract
       ├── factory.ts       ← getPaymentProvider() reads PAYMENT_PROVIDER env
       └── null/            ← NullPaymentProvider (v1 default)
```

No product domain imports Prisma directly for billing data. All billing access goes through `packages/billing`.

---

## Provider Abstraction

### The PaymentProvider Interface

`packages/billing/src/providers/interface.ts` defines the contract every provider must implement:

```typescript
interface PaymentProvider {
  name: string

  // Redirect user to provider's hosted checkout
  createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSession>

  // Redirect user to provider's hosted billing portal
  createBillingPortalSession(params: { providerCustomerId: string; returnUrl: string }): Promise<{ url: string }>

  // Verify and parse an inbound webhook POST body
  constructWebhookEvent(payload: string, signature: string): Promise<ProviderWebhookEvent>

  // Cancel subscription at period end (provider-side)
  cancelSubscription(providerSubscriptionId: string): Promise<void>

  // Upgrade/downgrade to a different price (provider-side)
  updateSubscription(providerSubscriptionId: string, newProviderPriceId: string): Promise<void>
}
```

### Normalized Event Types

Providers emit different event shapes. The adapter translates them to:

```typescript
type ProviderWebhookEvent =
  | { type: "subscription.created";  data: NormalizedSubscription }
  | { type: "subscription.updated";  data: NormalizedSubscription }
  | { type: "subscription.canceled"; data: NormalizedSubscription }
  | { type: "invoice.paid";          data: NormalizedInvoice }
  | { type: "invoice.payment_failed"; data: NormalizedInvoice }
```

`processWebhookEvent()` in `webhooks.ts` consumes these types exclusively — it never sees provider-specific types.

### Provider Selection

`getPaymentProvider()` reads `process.env.PAYMENT_PROVIDER` and returns the corresponding adapter:

| `PAYMENT_PROVIDER` | Adapter |
|--------------------|---------|
| (unset / `"null"`) | `NullPaymentProvider` |
| `"stripe"` | `StripeProvider` (not yet implemented) |
| `"paddle"` | `PaddleProvider` (not yet implemented) |
| `"lemon_squeezy"` | `LemonSqueezyProvider` (not yet implemented) |
| `"iyzico"` | `IyzicoProvider` (not yet implemented) |

---

## NullPaymentProvider (v1)

The default provider when `PAYMENT_PROVIDER` is not set. It is a production no-op — not a mock.

**Behavior:**
- `createCheckoutSession` — redirects to `cancelUrl?notice=payment_not_configured`
- `createBillingPortalSession` — redirects to `returnUrl?notice=payment_not_configured`
- `constructWebhookEvent` — always throws (no webhooks in null mode)
- `cancelSubscription` / `updateSubscription` — no-ops

Subscriptions created while `NullPaymentProvider` is active are stored with `providerSubscriptionId = null`. These are "manually managed" subscriptions — the admin creates them directly via the admin panel without a payment provider.

---

## Entitlement Model

### checkEntitlement()

The single function product code uses to check access:

```typescript
import { checkEntitlement } from "@repo/billing"

const entitlement = await checkEntitlement({
  orgId: org.id,
  productSlug: "product-a",
})

if (!entitlement.hasAccess) {
  return <UpgradePrompt />
}

const limit = entitlement.featureValue("seat_limit")
```

### Access Sources

Access is granted when either condition is true:

1. **Subscription path**: the org has an `ACTIVE` or `TRIALING` subscription for the product
2. **Grant path**: the org has a non-revoked, non-expired `AccessGrant` for the product

`entitlement.source` indicates which path granted access: `"subscription"`, `"grant"`, or `"none"`.

```
subscription → hasAccess: true, plan: {...}, source: "subscription"
grant        → hasAccess: true, plan: null,  source: "grant"
neither      → hasAccess: false, plan: null, source: "none"
```

### AccessGrant

`AccessGrant` is the manual override path. Use it for:
- Beta/early-access accounts
- Comped accounts (partnerships, press, internal)
- Accounts transitioning from a different billing model

Create grants via the admin panel (when built) or directly in the database during early operations.

---

## Webhook Processing

### Flow

```
Provider → POST /api/webhooks/billing
         → Provider adapter verifies signature
         → Provider adapter normalizes event → ProviderWebhookEvent
         → processWebhookEvent(event) in webhooks.ts
         → DB upsert/update + AuditLog
```

### Route Handler Location

`apps/dashboard/app/api/webhooks/billing/route.ts` (not yet created — required when a live provider is configured)

Pattern mirrors the Clerk webhook handler:

```typescript
export async function POST(req: Request) {
  const payload = await req.text()
  const signature = req.headers.get("stripe-signature") ?? ""

  const provider = getPaymentProvider()
  const event = await provider.constructWebhookEvent(payload, signature)
  const result = await processWebhookEvent(event)

  if (!result.ok) {
    logger.warn("billing.webhook.skipped", result)
  }

  return new Response("ok", { status: 200 })
}
```

Return `200` even for skipped events — returning `4xx` causes providers to retry indefinitely.

### Idempotency

All handlers use `upsert` or `updateMany` patterns:
- Subscription upsert is keyed on `providerSubscriptionId`
- Invoice upsert is keyed on `providerInvoiceId`
- Calling the same handler twice for the same event is safe

---

## Invoice Numbering

Invoices are numbered sequentially per calendar year: `INV-2026-0001`, `INV-2026-0002`, etc.

`generateInvoiceNumber()` in `webhooks.ts` counts invoices created in the current year and uses `count + 1`. This is not perfectly atomic under concurrent load, but:
- Invoice creation is low-frequency (one per billing period per customer)
- Duplicates are caught by the `@@unique([invoiceNumber])` DB constraint
- On constraint violation, the caller can retry

---

## Price Table

The `Price` table links a `Plan` to one or more provider price IDs:

```
Plan ─── Price (providerPriceId, billingInterval)
```

When a provider webhook arrives with a `providerPriceId`, `webhooks.ts` looks up the `Price` record to resolve the `Plan`. This means:
- A single plan can have multiple provider prices (e.g. monthly and annual)
- Changing providers requires only adding new `Price` rows — the Plan model is provider-agnostic

Populate `Price` rows when configuring a live provider (see below).

---

## Integrating a Live Payment Provider

Follow these steps to wire in a payment provider (e.g. Stripe).

### Step 1 — Implement the provider adapter

Create `packages/billing/src/providers/stripe/index.ts` implementing `PaymentProvider`.

Key responsibilities:
- `constructWebhookEvent`: use the provider SDK's signature verification (never skip this)
- Normalize provider-specific subscription/invoice fields to `NormalizedSubscription` / `NormalizedInvoice`
- Map provider status strings to the normalized status enum

### Step 2 — Register in factory.ts

```typescript
case "stripe":
  return new StripeProvider(process.env.STRIPE_SECRET_KEY!)
```

### Step 3 — Add environment variables

| Variable | Description |
|----------|-------------|
| `PAYMENT_PROVIDER` | Set to `"stripe"` (or other provider key) |
| `STRIPE_SECRET_KEY` | Provider secret key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from provider dashboard |

### Step 4 — Create Price records

For each `Plan`, create one or more `Price` rows with the provider's price/variant IDs:

```sql
INSERT INTO prices (id, plan_id, provider_price_id, billing_interval, unit_amount, currency, is_active)
VALUES (gen_random_uuid(), '<plan-id>', 'price_xxx', 'MONTH', 4900, 'usd', true);
```

Or run a one-time seed script under `prisma/seeds/`.

### Step 5 — Create the billing webhook route

Create `apps/dashboard/app/api/webhooks/billing/route.ts` following the pattern in the Webhook Processing section above.

### Step 6 — Register the webhook endpoint with the provider

In the provider's dashboard, add a webhook endpoint pointing to:

```
https://<your-domain>/api/webhooks/billing
```

Subscribe to at minimum:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

(Exact event names vary by provider — translate to the normalized types in the adapter.)

### Step 7 — Test

1. Use the provider's test mode / sandbox environment
2. Create a test checkout session via the dashboard UI
3. Trigger test webhook events from the provider dashboard
4. Verify `Subscription` and `Invoice` records are created in the DB
5. Verify `AuditLog` entries are created

---

## Adding a New Plan

1. Add the `Plan` row (name, slug, displayPrice, billingInterval, product FK)
2. Add `PlanFeature` rows for any feature flags/limits the plan grants
3. If live billing: add `Price` rows with the provider price IDs
4. Update the pricing page copy in `apps/web`

---

## Subscription Lifecycle (Admin-Managed)

When `NullPaymentProvider` is active, the admin panel manages subscriptions directly:

```
createSubscription(input)    — creates ACTIVE or TRIALING subscription
updateSubscription(input)    — changes plan (upgrade/downgrade)
cancelSubscription(input)    — cancels immediately or at period end
```

These are in `packages/billing/src/subscriptions.ts` and are also used by the provider webhook processor after verifying the provider's own state change.

---

## Billing Status (UI)

`getOrgBillingStatus(orgId)` returns the full billing status for the billing settings page:

```typescript
const { billing, subscription, hasActiveAccess } = await getOrgBillingStatus(org.id)

if (!billing.isLive) {
  return <BillingNotConfiguredBanner />
}

if (!subscription) {
  return <NoActivePlanPrompt />
}

// subscription.status, subscription.planName, subscription.currentPeriodEnd, etc.
```

Cache at request scope with React's `cache()`.

---

## Troubleshooting

### Webhook returns "No organization found for customer"

The `providerCustomerId` on the inbound event doesn't match any `Subscription.providerCustomerId` in the DB. This happens when:
- The subscription was created outside the normal flow (provider dashboard)
- The customer ID wasn't stored during checkout

Fix: ensure `createCheckoutSession` stores `providerCustomerId` on the subscription after checkout completes.

### Webhook returns "No plan found for provider price ID"

The `providerPriceId` on the event doesn't match any `Price.providerPriceId`. Fix: add the missing `Price` row (see Step 4 above).

### Invoice number collision

Two concurrent invoices generated the same `INV-YYYY-NNNN`. The DB unique constraint will reject the second insert. The webhook will return 500, the provider will retry, and the retry will succeed (the first invoice now exists, the upsert will update it instead of inserting).

### `entitlement.hasAccess` is false but subscription exists

Check subscription `status`: only `ACTIVE` and `TRIALING` grant access. `PAST_DUE` and `PAUSED` do not. If the payment failed, the subscription is `PAST_DUE` — prompt the user to update their payment method via `createBillingPortalSession`.
