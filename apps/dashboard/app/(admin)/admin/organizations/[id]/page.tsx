import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requirePlatformStaff } from "../../../../../lib/auth"
import { getOrganization } from "../../../../../lib/admin/organizations"
import { listAllPlans } from "../../../../../lib/admin/plans"
import { createSubscriptionAction, cancelSubscriptionAction } from "./_subscription-actions"
import { PageHeader } from "../../../../../components/admin/page-header"
import { FormField } from "../../../../../components/admin/form-field"
import { Badge } from "../../../../../components/ui/badge"
import { Button } from "../../../../../components/ui/button"
import { Input } from "../../../../../components/ui/input"
import { Select } from "../../../../../components/ui/select"
import { Textarea } from "../../../../../components/ui/textarea"

export const metadata: Metadata = { title: "Organization — Admin" }

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ subError?: string }>
}

export default async function AdminOrgDetailPage({ params, searchParams }: Props) {
  await requirePlatformStaff()
  const { id } = await params
  const { subError } = await searchParams

  const [org, allPlans] = await Promise.all([getOrganization(id), listAllPlans()])
  if (!org) notFound()

  const createSubAction = createSubscriptionAction.bind(null, org.id)
  const cancelSubAction = cancelSubscriptionAction.bind(null, org.id)

  // Group plans by product for the optgroup selector
  const plansByProduct = allPlans.reduce<
    Record<string, { productName: string; plans: typeof allPlans }>
  >((acc, plan) => {
    if (!acc[plan.productId]) {
      acc[plan.productId] = { productName: plan.productName, plans: [] }
    }
    acc[plan.productId]!.plans.push(plan)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <PageHeader
        title={org.name}
        description={`/${org.slug} · ID: ${org.id}`}
        breadcrumbs={[
          { label: "Organizations", href: "/admin/organizations" },
          { label: org.name },
        ]}
      />

      {/* Subscription error banner */}
      {subError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          {decodeURIComponent(subError)}
        </div>
      )}

      {/* Members */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">
          Members ({org.members.length})
        </h2>
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {org.members.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-2.5 text-zinc-300">{m.user.email}</td>
                  <td className="px-4 py-2.5 text-zinc-400">
                    {[m.user.firstName, m.user.lastName].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={m.role === "ADMIN" ? "default" : "secondary"}>{m.role}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zinc-500">
                    {m.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscriptions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">
          Subscriptions ({org.subscriptions.length})
        </h2>
        {org.subscriptions.length === 0 ? (
          <p className="text-sm text-zinc-500">No subscriptions.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Period end</th>
                  <th className="px-4 py-3">Managed</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {org.subscriptions.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                      {s.productSlug}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-300">{s.planName}</td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant={
                          s.status === "ACTIVE"
                            ? "success"
                            : s.status === "CANCELED"
                              ? "destructive"
                              : "warning"
                        }
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">
                      {s.currentPeriodEnd.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={s.isManagedManually ? "warning" : "secondary"}>
                        {s.isManagedManually ? "Manual" : "Provider"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {(s.status === "ACTIVE" || s.status === "TRIALING") && (
                        <form action={cancelSubAction.bind(null, s.id)}>
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="border-red-900/60 text-red-400 hover:bg-red-950/40 hover:text-red-300"
                          >
                            Cancel
                          </Button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Subscription */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">Add Subscription</h2>
        <div className="max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          {allPlans.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No active plans available. Create a product and plan first.
            </p>
          ) : (
            <form action={createSubAction} className="space-y-4">
              <FormField label="Plan" htmlFor="planId" required>
                <Select id="planId" name="planId">
                  <option value="">Select a plan…</option>
                  {Object.values(plansByProduct).map(({ productName, plans }) => (
                    <optgroup key={productName} label={productName}>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} — {plan.billingInterval.toLowerCase()}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </FormField>

              <FormField
                label="Trial days"
                htmlFor="trialDays"
                description="Leave blank or set to 0 for immediate active status."
              >
                <Input
                  id="trialDays"
                  name="trialDays"
                  type="number"
                  min={0}
                  max={90}
                  placeholder="0"
                />
              </FormField>

              <FormField
                label="Notes"
                htmlFor="notes"
                description="Internal note. Optional, max 512 characters."
              >
                <Textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  placeholder="e.g. Onboarding pilot, Q2 trial"
                />
              </FormField>

              <div className="pt-1">
                <Button type="submit" size="sm">
                  Create subscription
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Access Grants */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">
          Access Grants ({org.grants.length})
        </h2>
        {org.grants.length === 0 ? (
          <p className="text-sm text-zinc-500">No access grants.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Granted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {org.grants.map((g) => (
                  <tr key={g.id}>
                    <td className="px-4 py-2.5 text-zinc-300">{g.productName}</td>
                    <td className="max-w-xs truncate px-4 py-2.5 text-zinc-400">
                      {g.reason ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">
                      {g.expiresAt ? g.expiresAt.toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={g.revokedAt ? "destructive" : "success"}>
                        {g.revokedAt ? "Revoked" : "Active"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">
                      {g.createdAt.toLocaleDateString()}
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
