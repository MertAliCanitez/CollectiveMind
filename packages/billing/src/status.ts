/**
 * Billing configuration and organization billing status.
 *
 * These functions are used by:
 *   - Dashboard UI: render "billing not configured" states
 *   - Admin panel: show whether payment is wired in
 *   - Server components: decide which billing UI variant to render
 *
 * getBillingConfiguration() is cheap (env var read, no DB call).
 * getOrgBillingStatus()    requires a DB query — cache it at request scope.
 */
import { db } from "@repo/database"
import { formatCurrency } from "@repo/shared"
import type { BillingConfiguration, BillingProviderName, OrgBillingStatus, SubscriptionUIState } from "./types.js"

/**
 * Returns whether a live payment provider is configured.
 * Pure function — reads only the PAYMENT_PROVIDER environment variable.
 *
 * @example
 * const { isLive } = getBillingConfiguration()
 * if (!isLive) return <BillingNotConfiguredBanner />
 */
export function getBillingConfiguration(): BillingConfiguration {
  const raw = process.env["PAYMENT_PROVIDER"]
  const providerName = (raw && raw !== "" && raw !== "null" ? raw : "null") as BillingProviderName
  return {
    isLive: providerName !== "null",
    providerName,
  }
}

/**
 * Returns the full billing status for an organization, suitable for rendering
 * the billing settings page or showing access gates.
 *
 * Looks up the most recent active or trialing subscription for the org.
 * Returns null for subscription when no active plan exists.
 *
 * Cache this at request scope in Server Components:
 *   import { cache } from "react"
 *   const getCachedBillingStatus = cache(getOrgBillingStatus)
 */
export async function getOrgBillingStatus(orgId: string): Promise<OrgBillingStatus> {
  const billing = getBillingConfiguration()

  const subscription = await db.subscription.findFirst({
    where: {
      organizationId: orgId,
      status: { in: ["ACTIVE", "TRIALING", "PAST_DUE", "PAUSED"] },
    },
    include: {
      plan: {
        include: {
          product: { select: { slug: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  if (!subscription) {
    return {
      billing,
      subscription: null,
      hasActiveAccess: false,
    }
  }

  const uiState: SubscriptionUIState = {
    id: subscription.id,
    status: subscription.status as SubscriptionUIState["status"],
    planName: subscription.plan.name,
    planSlug: subscription.plan.slug,
    productSlug: subscription.plan.product.slug,
    billingInterval: subscription.plan.billingInterval,
    displayPrice: formatCurrency(subscription.plan.displayPrice, subscription.plan.currency),
    currentPeriodEnd: subscription.currentPeriodEnd,
    trialEndsAt: subscription.trialEndsAt,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    isManagedManually: !subscription.providerSubscriptionId,
  }

  const hasActiveAccess =
    subscription.status === "ACTIVE" || subscription.status === "TRIALING"

  return {
    billing,
    subscription: uiState,
    hasActiveAccess,
  }
}
