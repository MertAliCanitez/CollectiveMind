import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requirePlatformAdmin } from "../../../../../../../lib/auth"
import { getProduct } from "../../../../../../../lib/admin/products"
import { PageHeader } from "../../../../../../../components/admin/page-header"
import { FormField } from "../../../../../../../components/admin/form-field"
import { Input } from "../../../../../../../components/ui/input"
import { Select } from "../../../../../../../components/ui/select"
import { Textarea } from "../../../../../../../components/ui/textarea"
import { Button } from "../../../../../../../components/ui/button"
import { createPlanAction } from "../_actions"

export const metadata: Metadata = { title: "New Plan — Admin" }

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function NewPlanPage({ params, searchParams }: Props) {
  await requirePlatformAdmin()
  const { id } = await params
  const { error } = await searchParams

  const product = await getProduct(id)
  if (!product) notFound()

  const action = createPlanAction.bind(null, id)

  return (
    <div>
      <PageHeader
        title="New Plan"
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: product.name, href: `/admin/products/${id}` },
          { label: "New plan" },
        ]}
      />

      <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6">
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {decodeURIComponent(error)}
          </div>
        )}
        <form action={action} className="space-y-5">
          <FormField label="Name" htmlFor="name" required>
            <Input id="name" name="name" placeholder="e.g. Pro" autoFocus />
          </FormField>

          <FormField
            label="Slug"
            htmlFor="slug"
            required
            description="Must be globally unique across all plans."
          >
            <Input id="slug" name="slug" placeholder={`e.g. ${product.slug}-pro`} />
          </FormField>

          <FormField label="Description" htmlFor="description">
            <Textarea id="description" name="description" rows={2} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Billing interval" htmlFor="billingInterval" required>
              <Select id="billingInterval" name="billingInterval" defaultValue="MONTH">
                <option value="FREE">Free</option>
                <option value="MONTH">Monthly</option>
                <option value="YEAR">Yearly</option>
                <option value="ONE_TIME">One-time</option>
              </Select>
            </FormField>

            <FormField
              label="Display price (cents)"
              htmlFor="displayPrice"
              required
              description="e.g. 4900 = $49.00"
            >
              <Input
                id="displayPrice"
                name="displayPrice"
                type="number"
                min={0}
                defaultValue={0}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Status" htmlFor="status">
              <Select id="status" name="status" defaultValue="ACTIVE">
                <option value="ACTIVE">Active</option>
                <option value="LEGACY">Legacy</option>
                <option value="DEPRECATED">Deprecated</option>
              </Select>
            </FormField>

            <FormField label="Sort order" htmlFor="sortOrder">
              <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={0} />
            </FormField>
          </div>

          <FormField label="Public" htmlFor="isPublic" description="Visible in public catalog">
            <Select id="isPublic" name="isPublic" defaultValue="true">
              <option value="true">Yes</option>
              <option value="false">No (private)</option>
            </Select>
          </FormField>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">Create plan</Button>
            <a href={`/admin/products/${id}`} className="text-sm text-slate-500 hover:text-slate-700">
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
