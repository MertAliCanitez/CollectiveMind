# Product Catalog Content Runbook

This document covers how the product catalog is structured, where content lives, and how to make changes to products, plans, and marketing copy.

---

## Architecture Overview

The product catalog has two layers:

```
packages/billing/src/product-content.ts   ← marketing copy (TypeScript, static)
prisma/seed.ts (and DB)                    ← entitlement + pricing data (Prisma records)
         │
         ▼
packages/billing/src/catalog.ts            ← merges both into CatalogProduct / CatalogPlan
         │
         ▼
UI (apps/web pricing page, apps/dashboard billing settings)
```

**DB layer** (`Product`, `Plan`, `PlanFeature`) is the source of truth for:

- Which products exist and which are active
- What plans are available and at what price
- What features/entitlements each plan grants (key/value pairs)
- Subscription and access control logic

**Content layer** (`product-content.ts`) is the source of truth for:

- Product taglines and value propositions
- Plan card taglines, badges, and highlight bullets
- Feature key → human-readable label mappings (comparison table rows)
- CTA button labels

---

## File Map

| File                                      | Purpose                           |
| ----------------------------------------- | --------------------------------- |
| `packages/billing/src/product-content.ts` | All marketing copy                |
| `packages/billing/src/catalog.ts`         | Query layer — merges DB + content |
| `prisma/seed.ts`                          | Development DB seed               |
| `prisma/schema.prisma`                    | Product/Plan/PlanFeature schema   |

---

## Products

### Current product catalog

| Slug        | Name      | Status      | DB Sort |
| ----------- | --------- | ----------- | ------- |
| `insights`  | Insights  | ACTIVE      | 1       |
| `connect`   | Connect   | ACTIVE      | 2       |
| `workspace` | Workspace | COMING_SOON | 3       |

### Adding a new product

**Step 1 — DB record (seed / migration)**

Add to `prisma/seed.ts`:

```typescript
const myProduct = await db.product.upsert({
  where: { slug: "my-product" },
  update: {},
  create: {
    slug: "my-product",
    name: "My Product",
    description: "One sentence for admin/internal use.",
    status: ProductStatus.ACTIVE,
    sortOrder: 4, // next after existing products
  },
})
```

For production: create a Prisma migration or a one-off admin script instead of modifying seed.ts.

**Step 2 — Marketing content**

Add a `"my-product"` entry to `PRODUCT_CONTENT` in `product-content.ts`:

```typescript
"my-product": {
  tagline: "One-line product positioning",
  valueProposition:
    "2–3 sentences. Cover: what it does, who it's for, key differentiation.",
  featureDisplayConfig: [
    // One entry per PlanFeature key, in comparison-table row order:
    { key: "max_seats", label: "Team seats", format: "text" },
    { key: "api_access", label: "API access", format: "boolean" },
  ],
  plans: {
    // Populated below when you add plans
  },
},
```

**Step 3 — Add plans** (see below)

---

## Plans

### Plan slugs

Plan slugs follow the pattern `{product-slug}:{plan-name}` — always lowercase, hyphenated:

```
insights:free
insights:pro
insights:enterprise
connect:starter
connect:growth
connect:scale
```

### Adding a new plan

**Step 1 — DB record (seed / migration)**

```typescript
const myPlan = await db.plan.upsert({
  where: { slug: "insights:teams" },
  update: {},
  create: {
    productId: insights.id,
    name: "Teams",
    slug: "insights:teams",
    description: "For mid-size teams who need more than Pro.",
    billingInterval: BillingInterval.MONTH,
    displayPrice: 14900, // $149.00/month — in cents
    currency: "USD",
    isPublic: true,
    status: PlanStatus.ACTIVE,
    sortOrder: 3, // between Pro (2) and Enterprise (4)
    features: {
      create: [
        { key: "max_seats", value: "100" },
        { key: "reports_per_month", value: "unlimited" },
        { key: "data_retention_days", value: "365" },
        { key: "custom_dashboards", value: "true" },
        { key: "api_access", value: "true" },
        { key: "priority_support", value: "true" },
        { key: "sso_saml", value: "false" },
        { key: "white_label", value: "false" },
      ],
    },
  },
})
```

Feature keys must be consistent across all plans in a product. Any key present on one plan should be present on all plans (even if the value is `"false"` or `"0"`).

**Step 2 — Marketing content**

Add the plan entry to `PRODUCT_CONTENT["insights"].plans`:

```typescript
"insights:teams": {
  tagline: "For mid-size teams who need room to grow",
  badge: "best_value",  // optional
  ctaLabel: "Start free trial",
  highlights: [
    "Up to 100 team seats",
    "Unlimited reports",
    "1-year data retention",
    "Priority support included",
  ],
},
```

### Retiring a plan

Never delete plan records — existing subscriptions reference them. Instead:

1. Set `status: PlanStatus.LEGACY` in the DB (hides from public plan listing)
2. Set `isPublic: false` (belt-and-suspenders)
3. Keep the plan content in `product-content.ts` (subscribed users may still see their plan name)

---

## Feature Keys

Feature keys are the contract between the billing domain and product logic. They are read by `checkEntitlement()` to determine what an org can do.

### Conventions

- Lowercase snake_case
- Scoped to the product (don't reuse the same key across products unless the semantics are identical)
- Values are always strings: `"true"` / `"false"` for booleans, numeric strings for limits, human-readable for text (`"unlimited"`, `"custom"`)
- Every plan in a product should define the same set of keys

### Adding a new feature key

1. Add the `PlanFeature` rows to all plans in the product (via migration or seed update)
2. Add a `FeatureDisplay` entry to `featureDisplayConfig` in `product-content.ts`
3. Use the key in product code via `entitlement.featureValue("my_key")`

### Removing a feature key

1. Remove usage from product code first
2. Remove from `featureDisplayConfig` in `product-content.ts`
3. Leave the `PlanFeature` DB rows — orphaned feature rows don't cause errors

---

## Billing Configuration Display Mode

`getProductCatalog()` includes `billing.isLive` in its response. When `false`, no live payment provider is configured.

The UI should handle this:

```typescript
const { products, billing } = await getProductCatalog()

// On the pricing card CTA:
const ctaLabel = billing.isLive ? (plan.content?.ctaLabel ?? "Get started") : "Contact us"
```

Plan prices (`formattedPrice`) are always returned regardless of billing configuration — they are display values from the DB, not live provider prices. This lets you show a pricing page even before payment is wired in.

---

## Plan Comparison Table

`CatalogProduct.comparisonConfig` provides the ordered rows for a comparison table:

```typescript
const product = await getCatalogProduct("insights")

// product.comparisonConfig is FeatureDisplay[] in row order
// product.plans[n].features is keyed by feature key

// Build a comparison matrix:
const rows = product.comparisonConfig.map((config) => ({
  label: config.label,
  format: config.format,
  values: product.plans.map((plan) => {
    const feature = plan.features.find((f) => f.key === config.key)
    return feature?.value ?? null
  }),
}))
```

Format semantics:

- `"boolean"`: `"true"` → checkmark icon, `"false"` → dash icon
- `"text"`: render as-is (`"unlimited"`, `"custom"`, `"30"`)
- `"number"`: render as-is (numeric string — format with locale if needed)

---

## Plan Badges

`PlanBadge` values and their intended use:

| Badge          | Use case                                                                               |
| -------------- | -------------------------------------------------------------------------------------- |
| `most_popular` | Highlight the tier most customers choose. Use on at most one plan per product.         |
| `best_value`   | Highlight the tier with the best per-unit economics. Typically the annual/higher tier. |
| `enterprise`   | Signal that this plan requires a sales conversation. Usually the top tier.             |

Only one plan per product should carry a badge. Having two plans badged dilutes the signal.

---

## Plan Content Guidelines

### Taglines

- 3–7 words
- Describe the customer, not the feature: "For growing teams" not "25 seats included"
- Present tense, no punctuation

### Highlight bullets

- 3–5 bullets per plan
- Sentence fragments (noun phrases or short verb phrases)
- Lead with the most important differentiator from the tier below
- Max 60 characters
- Do not repeat what's already communicated by the price

### Value propositions

- 2–3 sentences
- Structure: [what it does] → [who it's for] → [key differentiation]
- Avoid superlatives ("best", "most powerful") and vague claims ("world-class")
- Write for a skeptical reader who has seen many SaaS pitches

### CTA labels

- Free tier: "Get started free" or "Start for free"
- Paid tier with trial: "Start free trial"
- Paid tier without trial: "Get started"
- Enterprise / sales: "Contact sales"

---

## Troubleshooting

### `getCatalogProduct` returns `null`

The product either doesn't exist in the DB or has `status !== "ACTIVE"`. Check:

- `db.product.findFirst({ where: { slug: "..." } })` — does the row exist?
- Is `status` set to `ACTIVE`? COMING_SOON products are excluded from `getProductCatalog` and `getCatalogProduct`.

### Plan missing from catalog

`getProductCatalog()` filters on `isPublic: true` and `status: "ACTIVE"`. If a plan is not appearing:

- Check `isPublic` — set to `false` for internal/legacy plans
- Check `status` — `LEGACY` and `DEPRECATED` plans are excluded

### Content not showing on pricing card

The plan slug in `PRODUCT_CONTENT[productSlug].plans` must exactly match `Plan.slug` in the DB. Check for typos. `getPlanContent("insights:pro")` returns `null` if the key doesn't match.

### Feature not appearing in comparison table

The feature key must be present in both:

1. `PlanFeature` rows in the DB for all plans in the product
2. `featureDisplayConfig` array in `PRODUCT_CONTENT` for the product

If only the DB row exists, the feature is available to `checkEntitlement()` but won't render in the comparison table. If only the content entry exists, the label is registered but no value will be shown (all `null`).
