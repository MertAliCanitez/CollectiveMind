import type { Metadata } from "next"
import { requirePlatformStaff } from "../../../../lib/auth"
import {
  getAnalyticsOverview,
  formatCentsDisplay,
  type ProductSubscriptionStat,
} from "../../../../lib/admin/analytics"
import { PageHeader } from "../../../../components/admin/page-header"

export const metadata: Metadata = { title: "Analytics — Admin" }

export default async function AdminAnalyticsPage() {
  await requirePlatformStaff()
  const overview = await getAnalyticsOverview()

  return (
    <div className="space-y-8">
      <PageHeader title="Analytics" description="Internal operations overview" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Active Organizations
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-100">
            {overview.activeOrgs.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Non-deleted, synced from Clerk</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Active Subscriptions
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-100">
            {overview.activeSubscriptions.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Status: ACTIVE</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Trialing Subscriptions
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-100">
            {overview.trialingSubscriptions.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Status: TRIALING</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Active Access Grants
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-100">
            {overview.activeGrants.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Not revoked, not expired</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Est. MRR</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-amber-400">
            {formatCentsDisplay(overview.estimatedMrrCents)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Estimate — display prices only</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Est. ARR</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-amber-400">
            {formatCentsDisplay(overview.estimatedArrCents)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Estimate — display prices only</p>
        </div>
      </div>

      {/* Estimate disclaimer */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-xs text-amber-500">
        <span className="mt-0.5 shrink-0">⚠</span>
        <span>
          <strong className="font-semibold text-amber-400">Revenue figures are estimates only.</strong>{" "}
          MRR and ARR are derived from plan display prices, not from collected payments. No live
          payment integration is active (NullPaymentProvider). These numbers should not be treated
          as recognized revenue.
        </span>
      </div>

      {/* Per-product breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300">Subscriptions by Product</h2>
        {overview.productBreakdown.length === 0 ? (
          <p className="text-sm text-zinc-500">No active or trialing subscriptions.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Trialing</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {overview.productBreakdown.map((stat: ProductSubscriptionStat) => (
                  <tr key={stat.productId}>
                    <td className="px-4 py-2.5">
                      <div>
                        <p className="font-medium text-zinc-100">{stat.productName}</p>
                        <p className="font-mono text-xs text-zinc-500">{stat.productSlug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-300">{stat.activeCount}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{stat.trialingCount}</td>
                    <td className="px-4 py-2.5 font-medium text-zinc-200">
                      {stat.activeCount + stat.trialingCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
