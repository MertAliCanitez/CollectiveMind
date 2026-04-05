/**
 * Admin data layer — Analytics Overview.
 *
 * All metrics are computed from the current DB state.
 * Revenue figures (MRR/ARR) are estimates derived from plan display prices —
 * not real collected revenue. NullPaymentProvider is active at v1.
 * Auth is enforced by the calling page via requirePlatformStaff().
 */
import { db } from "@repo/database"

export interface ProductSubscriptionStat {
  productId: string
  productName: string
  productSlug: string
  activeCount: number
  trialingCount: number
}

export interface AnalyticsOverview {
  /** Organizations that have not been soft-deleted. */
  activeOrgs: number
  /** Subscriptions with status = ACTIVE. */
  activeSubscriptions: number
  /** Subscriptions with status = TRIALING. */
  trialingSubscriptions: number
  /** Access grants that are not revoked and not expired. */
  activeGrants: number
  /**
   * Estimated MRR in cents.
   * MONTH plans: displayPrice. YEAR plans: displayPrice / 12 (rounded).
   * FREE and ONE_TIME plans contribute zero.
   * Based on displayPrice, not collected payment — label as estimate.
   */
  estimatedMrrCents: number
  /**
   * Estimated ARR in cents.
   * MONTH plans: displayPrice × 12. YEAR plans: displayPrice.
   * Based on displayPrice, not collected payment — label as estimate.
   */
  estimatedArrCents: number
  /** ACTIVE + TRIALING subscription counts per product, sorted by product sortOrder. */
  productBreakdown: ProductSubscriptionStat[]
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const now = new Date()

  const [activeOrgs, activeSubscriptions, trialingSubscriptions, activeGrants, revenueData, breakdownData] =
    await Promise.all([
      db.organization.count({ where: { deletedAt: null } }),

      db.subscription.count({ where: { status: "ACTIVE" } }),

      db.subscription.count({ where: { status: "TRIALING" } }),

      db.accessGrant.count({
        where: {
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),

      // Revenue estimate — ACTIVE only (not TRIALING, not paid plans)
      db.subscription.findMany({
        where: { status: "ACTIVE" },
        select: {
          plan: { select: { displayPrice: true, billingInterval: true } },
        },
      }),

      // Per-product breakdown — ACTIVE + TRIALING
      db.subscription.findMany({
        where: { status: { in: ["ACTIVE", "TRIALING"] } },
        select: {
          status: true,
          plan: {
            select: {
              product: {
                select: { id: true, name: true, slug: true, sortOrder: true },
              },
            },
          },
        },
      }),
    ])

  // ── Revenue estimates ───────────────────────────────────────────────────────
  let estimatedMrrCents = 0
  let estimatedArrCents = 0

  for (const sub of revenueData) {
    const { displayPrice, billingInterval } = sub.plan
    if (billingInterval === "MONTH") {
      estimatedMrrCents += displayPrice
      estimatedArrCents += displayPrice * 12
    } else if (billingInterval === "YEAR") {
      estimatedMrrCents += Math.round(displayPrice / 12)
      estimatedArrCents += displayPrice
    }
    // FREE and ONE_TIME contribute nothing to MRR/ARR
  }

  // ── Per-product breakdown ──────────────────────────────────────────────────
  const productMap = new Map<
    string,
    { name: string; slug: string; sortOrder: number; activeCount: number; trialingCount: number }
  >()

  for (const sub of breakdownData) {
    const p = sub.plan.product
    if (!productMap.has(p.id)) {
      productMap.set(p.id, {
        name: p.name,
        slug: p.slug,
        sortOrder: p.sortOrder,
        activeCount: 0,
        trialingCount: 0,
      })
    }
    const stat = productMap.get(p.id)!
    if (sub.status === "ACTIVE") stat.activeCount++
    else if (sub.status === "TRIALING") stat.trialingCount++
  }

  const productBreakdown: ProductSubscriptionStat[] = Array.from(productMap.entries())
    .sort(([, a], [, b]) => a.sortOrder - b.sortOrder)
    .map(([productId, stat]) => ({
      productId,
      productName: stat.name,
      productSlug: stat.slug,
      activeCount: stat.activeCount,
      trialingCount: stat.trialingCount,
    }))

  return {
    activeOrgs,
    activeSubscriptions,
    trialingSubscriptions,
    activeGrants,
    estimatedMrrCents,
    estimatedArrCents,
    productBreakdown,
  }
}

/** Format cents to a display string like "$1,234" (no decimals for whole dollars). */
export function formatCentsDisplay(cents: number): string {
  const dollars = cents / 100
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(dollars)
}
