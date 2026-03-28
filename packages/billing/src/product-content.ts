/**
 * Static product and plan marketing content.
 *
 * This module holds the human-facing copy that lives alongside the billing domain:
 * taglines, value propositions, plan highlights, comparison metadata, and CTAs.
 *
 * Why here and not in the database?
 *   - Content changes with product marketing, not with billing logic.
 *   - Keeping it as typed TypeScript co-locates it with the domain that owns it
 *     and makes it trivially refactorable (rename a key → compiler catches all uses).
 *   - A CMS or DB table would be appropriate when non-engineers need to edit copy.
 *     At v1, that is not a requirement.
 *
 * Convention: keys are product/plan slugs (e.g. "insights", "insights:pro").
 *
 * See docs/04-runbooks/catalog-content.md for editing guidelines.
 */

// ─── Feature display configuration ───────────────────────────────────────────

/**
 * How a PlanFeature key should be rendered in a comparison table.
 * Used by the pricing page to display feature rows consistently across plans.
 */
export interface FeatureDisplay {
  /** The PlanFeature.key this entry maps to */
  key: string
  /** Human-readable label shown in the comparison table */
  label: string
  /** Optional tooltip / explainer text */
  hint?: string
  /**
   * How the raw string value should be formatted for display:
   *   boolean — "true" → checkmark, "false" → dash
   *   number  — pass through as-is (e.g. "10,000")
   *   text    — pass through as-is (e.g. "unlimited", "custom")
   */
  format: "boolean" | "number" | "text"
}

// ─── Plan content ─────────────────────────────────────────────────────────────

export type PlanBadge = "most_popular" | "best_value" | "enterprise"

/**
 * Marketing content for a single plan tier.
 * Shown on pricing cards and comparison tables.
 */
export interface PlanContent {
  /** One-line positioning, e.g. "For growing teams" */
  tagline: string
  /** Optional badge shown on the pricing card */
  badge?: PlanBadge
  /** Primary CTA button label */
  ctaLabel: string
  /**
   * 3–5 highlight bullets for the pricing card.
   * These are the key selling points; not an exhaustive feature list.
   * Use sentence fragments, start with a noun or verb.
   * Max 60 characters each.
   */
  highlights: string[]
}

// ─── Product content ──────────────────────────────────────────────────────────

/**
 * Marketing content for a product.
 * Used on product overview cards and product-specific pricing pages.
 */
export interface ProductContent {
  /** One-line product tagline for cards and headers */
  tagline: string
  /**
   * 2–3 sentence value proposition.
   * Covers: what it does, who it's for, key differentiation.
   */
  valueProposition: string
  /**
   * Ordered list of feature display configs for comparison tables.
   * Each entry's `key` must match a PlanFeature.key value for this product's plans.
   * Order determines the row order in the comparison table.
   */
  featureDisplayConfig: FeatureDisplay[]
  /**
   * Per-plan content, keyed by plan slug.
   * Plans without an entry here will render without marketing copy.
   */
  plans: Record<string, PlanContent>
}

// ─── Content registry ─────────────────────────────────────────────────────────

/**
 * All product marketing content, keyed by product slug.
 *
 * Add a new entry here when adding a new product to the seed/DB.
 * The catalog module merges this with DB data in getProductCatalog().
 */
export const PRODUCT_CONTENT: Record<string, ProductContent> = {
  insights: {
    tagline: "Team analytics you'll actually use",
    valueProposition:
      "Insights turns your organization's data into clear, shareable reports — " +
      "without requiring a data engineering team. Built for operators and growth leads " +
      "who need answers fast, not dashboards that take weeks to configure.",
    featureDisplayConfig: [
      { label: "Team seats", key: "max_seats", format: "text" },
      { label: "Reports per month", key: "reports_per_month", format: "text" },
      { label: "Data retention", key: "data_retention_days", format: "text" },
      { label: "Custom dashboards", key: "custom_dashboards", format: "boolean" },
      { label: "API access", key: "api_access", format: "boolean" },
      { label: "Priority support", key: "priority_support", format: "boolean" },
      { label: "SSO / SAML", key: "sso_saml", format: "boolean" },
      { label: "White-label exports", key: "white_label", format: "boolean" },
    ],
    plans: {
      "insights:free": {
        tagline: "Start for free, no card required",
        ctaLabel: "Get started free",
        highlights: [
          "Up to 3 team seats",
          "10 reports per month",
          "30-day data retention",
          "Pre-built report templates",
        ],
      },
      "insights:pro": {
        tagline: "For growing teams that run on data",
        badge: "most_popular",
        ctaLabel: "Start free trial",
        highlights: [
          "Up to 25 team seats",
          "Unlimited reports",
          "1-year data retention",
          "Custom dashboards",
          "Full API access",
        ],
      },
      "insights:enterprise": {
        tagline: "For organizations that need full control",
        badge: "enterprise",
        ctaLabel: "Contact sales",
        highlights: [
          "Unlimited seats",
          "Custom data retention policies",
          "SSO / SAML authentication",
          "White-label report exports",
          "Dedicated support SLA",
        ],
      },
    },
  },

  connect: {
    tagline: "The integration backbone for your stack",
    valueProposition:
      "Connect gives your engineering team a managed API and webhook layer — " +
      "so you spend time building product, not maintaining integration infrastructure. " +
      "Ship reliable connections to third-party services without writing boilerplate retry logic.",
    featureDisplayConfig: [
      { label: "API calls / month", key: "api_calls_per_month", format: "text" },
      { label: "Webhooks", key: "webhooks", format: "text" },
      { label: "Active connections", key: "max_connections", format: "text" },
      { label: "Rate limit tier", key: "rate_limit_tier", format: "text" },
      { label: "Dedicated infrastructure", key: "dedicated_infra", format: "boolean" },
      { label: "Uptime SLA", key: "sla_uptime", format: "boolean" },
      { label: "Priority support", key: "priority_support", format: "boolean" },
    ],
    plans: {
      "connect:starter": {
        tagline: "Explore the platform, no commitment",
        ctaLabel: "Start building",
        highlights: [
          "10,000 API calls per month",
          "3 active webhooks",
          "3 integrations",
          "Standard rate limits",
        ],
      },
      "connect:growth": {
        tagline: "For teams shipping integrations at scale",
        badge: "most_popular",
        ctaLabel: "Start free trial",
        highlights: [
          "500,000 API calls per month",
          "Unlimited webhooks",
          "25 active connections",
          "Elevated rate limits",
          "Priority support",
        ],
      },
      "connect:scale": {
        tagline: "For teams where uptime is non-negotiable",
        badge: "best_value",
        ctaLabel: "Contact sales",
        highlights: [
          "5 million API calls per month",
          "Unlimited connections",
          "Dedicated infrastructure",
          "99.99% uptime SLA",
          "Priority engineering support",
        ],
      },
    },
  },

  workspace: {
    tagline: "Where your team thinks together",
    valueProposition:
      "Workspace brings async communication, project tracking, and shared knowledge " +
      "into one place — designed for distributed teams who need clarity without the chaos " +
      "of scattered tools.",
    featureDisplayConfig: [],
    plans: {},
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Look up content for a product. Returns null if no content is registered. */
export function getProductContent(productSlug: string): ProductContent | null {
  return PRODUCT_CONTENT[productSlug] ?? null
}

/** Look up content for a specific plan. Returns null if no content is registered. */
export function getPlanContent(planSlug: string): PlanContent | null {
  for (const product of Object.values(PRODUCT_CONTENT)) {
    const planContent = product.plans[planSlug]
    if (planContent) return planContent
  }
  return null
}

/**
 * Get the ordered feature display config for a product's comparison table.
 */
export function getFeatureDisplayConfig(productSlug: string): FeatureDisplay[] {
  return PRODUCT_CONTENT[productSlug]?.featureDisplayConfig ?? []
}
