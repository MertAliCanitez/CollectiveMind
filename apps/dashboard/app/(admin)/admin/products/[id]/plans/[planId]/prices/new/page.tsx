import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requirePlatformAdmin } from "../../../../../../../../../lib/auth"
import { getProduct } from "../../../../../../../../../lib/admin/products"
import { getPlan } from "../../../../../../../../../lib/admin/plans"
import { PageHeader } from "../../../../../../../../../components/admin/page-header"
import { FormField } from "../../../../../../../../../components/admin/form-field"
import { Input } from "../../../../../../../../../components/ui/input"
import { Select } from "../../../../../../../../../components/ui/select"
import { Button } from "../../../../../../../../../components/ui/button"
import { createPriceAction } from "../_actions"

export const metadata: Metadata = { title: "New Price — Admin" }

interface Props {
  params: Promise<{ id: string; planId: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function NewPricePage({ params, searchParams }: Props) {
  await requirePlatformAdmin()
  const { id, planId } = await params
  const { error } = await searchParams

  const [product, plan] = await Promise.all([getProduct(id), getPlan(planId)])
  if (!product || !plan) notFound()

  const action = createPriceAction.bind(null, id, planId)

  return (
    <div>
      <PageHeader
        title="New Price"
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: product.name, href: `/admin/products/${id}` },
          { label: plan.name, href: `/admin/products/${id}/plans/${planId}` },
          { label: "New price" },
        ]}
      />

      <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6">
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {decodeURIComponent(error)}
          </div>
        )}
        <form action={action} className="space-y-5">
          <FormField label="Nickname" htmlFor="nickname" description="e.g. Monthly USD">
            <Input id="nickname" name="nickname" placeholder="Optional" />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Unit amount (cents)"
              htmlFor="unitAmount"
              required
              description="e.g. 4900 = $49.00"
            >
              <Input
                id="unitAmount"
                name="unitAmount"
                type="number"
                min={0}
                defaultValue={plan.displayPrice}
              />
            </FormField>

            <FormField label="Currency" htmlFor="currency">
              <Input id="currency" name="currency" defaultValue="USD" maxLength={3} />
            </FormField>
          </div>

          <FormField label="Billing interval" htmlFor="billingInterval" required>
            <Select id="billingInterval" name="billingInterval" defaultValue={plan.billingInterval}>
              <option value="FREE">Free</option>
              <option value="MONTH">Monthly</option>
              <option value="YEAR">Yearly</option>
              <option value="ONE_TIME">One-time</option>
            </Select>
          </FormField>

          <FormField
            label="Provider price ID"
            htmlFor="providerPriceId"
            description="Stripe price_xxx or equivalent. Leave blank if billing not yet live."
          >
            <Input
              id="providerPriceId"
              name="providerPriceId"
              placeholder="price_..."
              className="font-mono text-xs"
            />
          </FormField>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">Create price</Button>
            <a
              href={`/admin/products/${id}/plans/${planId}`}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
