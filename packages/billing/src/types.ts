/**
 * Billing domain types.
 *
 * Types in this file are billing-domain concerns that live here rather than
 * in @repo/shared. Shared holds primitive schemas (Zod) and cross-domain
 * utilities. This file holds billing-specific state types used by the dashboard
 * UI, admin panel, and billing logic.
 */

// ─── Provider configuration ───────────────────────────────────────────────────

export type BillingProviderName = "null" | "stripe" | "paddle" | "lemon_squeezy" | "iyzico"

/**
 * Whether a real payment provider is wired in.
 * Used by UI components to show "billing not yet enabled" states.
 */
export interface BillingConfiguration {
  /** True when PAYMENT_PROVIDER is set to a non-null value */
  isLive: boolean
  /** The configured provider name, or "null" when running in no-op mode */
  providerName: BillingProviderName
}

// ─── Subscription domain state ────────────────────────────────────────────────

/**
 * Input for upgrading or changing a plan on an existing subscription.
 * Separate from CreateSubscriptionInput (different intent and validation).
 */
export interface UpdateSubscriptionInput {
  subscriptionId: string
  newPlanId: string
  /** Used to pass the provider price ID when live billing is active */
  newProviderPriceId?: string
  notes?: string
}

/**
 * Simplified subscription state for rendering in the dashboard billing portal.
 * Only includes what the UI needs — not the full DB record.
 */
export interface SubscriptionUIState {
  id: string
  status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELED"
  planName: string
  planSlug: string
  productSlug: string
  billingInterval: string
  /** Formatted display price, e.g. "$49.00" */
  displayPrice: string
  currentPeriodEnd: Date
  trialEndsAt: Date | null
  cancelAtPeriodEnd: boolean
  /** True when the subscription was created without a payment provider */
  isManagedManually: boolean
}

/**
 * What the billing settings page renders for an organization.
 * A null subscription means the org has no active plan.
 */
export interface OrgBillingStatus {
  billing: BillingConfiguration
  subscription: SubscriptionUIState | null
  /** True when the org has any active or trialing subscription */
  hasActiveAccess: boolean
}

// ─── Webhook processing ───────────────────────────────────────────────────────

/**
 * Result of processing a provider webhook event.
 * Used for logging and idempotency tracking.
 */
export type WebhookProcessingResult =
  | { ok: true; action: string; resourceId: string }
  | { ok: false; reason: string; skipped: boolean }
