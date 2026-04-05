import type { Metadata } from "next"
import { requireBillingAccess } from "../../../lib/auth"
import {
  getDashboardBillingStatus,
  getDashboardCatalog,
  getDashboardAccessibleProducts,
} from "../../../lib/billing"
import { Badge } from "../../../components/ui/badge"
import { EmptyState } from "../../../components/empty-state"
import { AlertCircle } from "../../../components/ui/icons"

export const metadata: Metadata = {
  title: "Billing",
}

export default async function BillingPage() {
  const { org } = await requireBillingAccess()

  // Three parallel queries — no sequential waterfall.
  // billingStatus: subscription detail (status, plan name, period end, etc.)
  // catalog: needed only for the billing.isLive flag (NullPaymentProvider = false at v1)
  // accessibleProducts: batch access list replacing the old per-product entitlement loop
  const [billingStatus, catalog, accessibleProducts] = await Promise.all([
    getDashboardBillingStatus(org.id),
    getDashboardCatalog(),
    getDashboardAccessibleProducts(org.id),
  ])

  const billingIsLive = catalog?.billing?.isLive ?? false
  const activeSubscriptions = accessibleProducts.filter((p) => p.accessSource === "subscription")
  const grantedAccess = accessibleProducts.filter((p) => p.accessSource === "grant")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Billing</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Subscription and payment details for {org.name}.
        </p>
      </div>

      {/* Billing not live notice */}
      {!billingIsLive && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-900/60 bg-amber-950/40 p-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-300">Online billing not yet active</p>
            <p className="mt-0.5 text-sm text-amber-400/80">
              Self-service billing management is coming soon. Contact us at{" "}
              <a href="mailto:billing@collectivemind.com" className="underline">
                billing@collectivemind.com
              </a>{" "}
              for any billing questions.
            </p>
          </div>
        </div>
      )}

      {/* Active subscriptions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">Active Subscriptions</h2>
        {activeSubscriptions.length === 0 ? (
          <EmptyState
            title="No active subscriptions"
            description="Your organization does not have any active paid subscriptions."
          />
        ) : (
          <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900">
            {activeSubscriptions.map((product) => (
              <div key={product.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-zinc-100">{product.name}</p>
                  <p className="text-xs text-zinc-500">{product.activePlan?.name} plan</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complimentary access */}
      {grantedAccess.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Complimentary Access</h2>
          <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900">
            {grantedAccess.map((product) => (
              <div key={product.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-zinc-100">{product.name}</p>
                  <p className="text-xs text-zinc-500">
                    Granted access — {product.activePlan?.name ?? "all features"}
                  </p>
                </div>
                <Badge variant="secondary">Granted</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription detail */}
      {billingStatus?.subscription && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Subscription Detail</h2>
          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Status</span>
              <Badge
                variant={billingStatus.subscription.status === "ACTIVE" ? "success" : "warning"}
              >
                {billingStatus.subscription.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Plan</span>
              <span className="font-medium text-zinc-100">
                {billingStatus.subscription.planName}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Price</span>
              <span className="font-medium text-zinc-100">
                {billingStatus.subscription.displayPrice}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Renews</span>
              <span className="text-zinc-300">
                {billingStatus.subscription.cancelAtPeriodEnd ? "Cancels on " : ""}
                {billingStatus.subscription.currentPeriodEnd.toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
