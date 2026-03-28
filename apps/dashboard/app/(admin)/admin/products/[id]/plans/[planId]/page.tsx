import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requirePlatformStaff } from "../../../../../../../lib/auth"
import { getProduct } from "../../../../../../../lib/admin/products"
import { getPlan, listPricesForPlan } from "../../../../../../../lib/admin/plans"
import { PageHeader } from "../../../../../../../components/admin/page-header"
import { FormField } from "../../../../../../../components/admin/form-field"
import { Input } from "../../../../../../../components/ui/input"
import { Select } from "../../../../../../../components/ui/select"
import { Textarea } from "../../../../../../../components/ui/textarea"
import { Button } from "../../../../../../../components/ui/button"
import { Badge } from "../../../../../../../components/ui/badge"
import { updatePlanAction } from "../_actions"

export const metadata: Metadata = { title: "Edit Plan — Admin" }

interface Props {
  params: Promise<{ id: string; planId: string }>
}

export default async function EditPlanPage({ params }: Props) {
  await requirePlatformStaff()
  const { id, planId } = await params

  const [product, plan, prices] = await Promise.all([
    getProduct(id),
    getPlan(planId),
    listPricesForPlan(planId),
  ])

  if (!product || !plan) notFound()

  const updateAction = updatePlanAction.bind(null, id, planId)

  return (
    <div className="space-y-8">
      <PageHeader
        title={plan.name}
        description={`Plan ID: ${plan.id}`}
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: product.name, href: `/admin/products/${id}` },
          { label: plan.name },
        ]}
      />

      {/* Edit form */}
      <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold text-slate-700">Plan details</h2>
        <form action={updateAction} className="space-y-5">
          <FormField label="Name" htmlFor="name" required>
            <Input id="name" name="name" defaultValue={plan.name} />
          </FormField>

          <FormField label="Slug" description="Read-only after creation.">
            <Input name="slug" defaultValue={plan.slug} disabled />
          </FormField>

          <FormField label="Description" htmlFor="description">
            <Textarea id="description" name="description" rows={2} defaultValue={plan.description ?? ""} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Billing interval" htmlFor="billingInterval" required>
              <Select id="billingInterval" name="billingInterval" defaultValue={plan.billingInterval}>
                <option value="FREE">Free</option>
                <option value="MONTH">Monthly</option>
                <option value="YEAR">Yearly</option>
                <option value="ONE_TIME">One-time</option>
              </Select>
            </FormField>

            <FormField label="Display price (cents)" htmlFor="displayPrice" required>
              <Input
                id="displayPrice"
                name="displayPrice"
                type="number"
                min={0}
                defaultValue={plan.displayPrice}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Status" htmlFor="status">
              <Select id="status" name="status" defaultValue={plan.status}>
                <option value="ACTIVE">Active</option>
                <option value="LEGACY">Legacy</option>
                <option value="DEPRECATED">Deprecated</option>
              </Select>
            </FormField>

            <FormField label="Sort order" htmlFor="sortOrder">
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={plan.sortOrder}
              />
            </FormField>
          </div>

          <FormField label="Public" htmlFor="isPublic">
            <Select id="isPublic" name="isPublic" defaultValue={plan.isPublic ? "true" : "false"}>
              <option value="true">Yes</option>
              <option value="false">No (private)</option>
            </Select>
          </FormField>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </div>

      {/* Feature entitlements */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Feature Entitlements ({plan.features.length})
        </h2>
        {plan.features.length === 0 ? (
          <p className="text-sm text-slate-500">No features defined for this plan.</p>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plan.features.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{f.key}</td>
                    <td className="px-4 py-2.5 text-slate-700">{f.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prices / billing intervals */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Prices ({prices.length})</h2>
          <Link href={`/admin/products/${id}/plans/${planId}/prices/new`}>
            <Button size="sm" variant="outline">
              + Add price
            </Button>
          </Link>
        </div>

        {prices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
            No provider prices configured.{" "}
            <Link
              href={`/admin/products/${id}/plans/${planId}/prices/new`}
              className="text-indigo-600 hover:underline"
            >
              Add a price.
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Nickname</th>
                  <th className="px-4 py-3">Amount (¢)</th>
                  <th className="px-4 py-3">Interval</th>
                  <th className="px-4 py-3">Provider ID</th>
                  <th className="px-4 py-3">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prices.map((price) => (
                  <tr key={price.id}>
                    <td className="px-4 py-2.5 text-slate-600">{price.nickname ?? "—"}</td>
                    <td className="px-4 py-2.5 text-slate-600">{price.unitAmount}</td>
                    <td className="px-4 py-2.5 text-slate-600">{price.billingInterval}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                      {price.providerPriceId ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={price.isActive ? "success" : "secondary"}>
                        {price.isActive ? "Yes" : "No"}
                      </Badge>
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
