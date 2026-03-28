import type { Metadata } from "next"
import { requireBillingAccess } from "../../../lib/auth"
import {
  getDashboardBillingStatus,
  getDashboardCatalog,
  getDashboardEntitlement,
} from "../../../lib/billing"
import { Badge } from "../../../components/ui/badge"
import { EmptyState } from "../../../components/empty-state"
import { AlertCircle } from "../../../components/ui/icons"

export const metadata: Metadata = {
  title: "Billing",
}

export default async function BillingPage() {
  const { org } = await requireBillingAccess()

  const [billingStatus, catalog] = await Promise.all([
    getDashboardBillingStatus(org.id),
    getDashboardCatalog(),
  ])

  const activeProducts = catalog?.products.filter((p) => p.status === "ACTIVE") ?? []
  const entitlements = await Promise.all(
    activeProducts.map((p) => getDashboardEntitlement(org.id, p.slug)),
  )

  const billingIsLive = catalog?.billing?.isLive ?? false

  const activeSubscriptions = entitlements
    .map((ent, i) => ({ ent, product: activeProducts[i]! }))
    .filter(({ ent }) => ent?.hasAccess && ent.source === "subscription")

  const grantedAccess = entitlements
    .map((ent, i) => ({ ent, product: activeProducts[i]! }))
    .filter(({ ent }) => ent?.hasAccess && ent.source === "grant")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing</h1>
        <p className="mt-1 text-sm text-slate-500">
          Subscription and payment details for {org.name}.
        </p>
      </div>

      {/* Billing not live notice */}
      {!billingIsLive && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">Online billing not yet active</p>
            <p className="mt-0.5 text-sm text-amber-700">
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
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Active Subscriptions</h2>
        {activeSubscriptions.length === 0 ? (
          <EmptyState
            title="No active subscriptions"
            description="Your organization does not have any active paid subscriptions."
          />
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {activeSubscriptions.map(({ ent, product }) => (
              <div key={product.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">{ent?.plan?.name} plan</p>
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
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Complimentary Access</h2>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {grantedAccess.map(({ ent, product }) => (
              <div key={product.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    Granted access — {ent?.plan?.name ?? "all features"}
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
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Subscription Detail</h2>
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Status</span>
              <Badge
                variant={billingStatus.subscription.status === "ACTIVE" ? "success" : "warning"}
              >
                {billingStatus.subscription.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Plan</span>
              <span className="font-medium text-slate-900">
                {billingStatus.subscription.planName}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Price</span>
              <span className="font-medium text-slate-900">
                {billingStatus.subscription.displayPrice}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Renews</span>
              <span className="text-slate-700">
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
