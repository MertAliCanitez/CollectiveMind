import type { Metadata } from "next"
import { requirePlatformAdmin } from "../../../../../lib/auth"
import { listProducts } from "../../../../../lib/admin/products"
import { listOrganizations } from "../../../../../lib/admin/organizations"
import { PageHeader } from "../../../../../components/admin/page-header"
import { FormField } from "../../../../../components/admin/form-field"
import { Input } from "../../../../../components/ui/input"
import { Select } from "../../../../../components/ui/select"
import { Textarea } from "../../../../../components/ui/textarea"
import { Button } from "../../../../../components/ui/button"
import { createGrantAction } from "../_actions"

export const metadata: Metadata = { title: "New Grant — Admin" }

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function NewGrantPage({ searchParams }: Props) {
  await requirePlatformAdmin()
  const { error } = await searchParams

  const [products, { orgs }] = await Promise.all([
    listProducts(),
    listOrganizations({ page: 1 }),
  ])

  const activeProducts = products.filter((p) => p.status !== "DEPRECATED")

  return (
    <div>
      <PageHeader
        title="New Access Grant"
        description="Grant an organization access to a product outside of normal billing."
        breadcrumbs={[
          { label: "Access Grants", href: "/admin/grants" },
          { label: "New" },
        ]}
      />

      <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6">
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {decodeURIComponent(error)}
          </div>
        )}
        <form action={createGrantAction} className="space-y-5">
          <FormField label="Organization" htmlFor="organizationId" required>
            <Select id="organizationId" name="organizationId">
              <option value="">Select organization…</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.slug})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Product" htmlFor="productId" required>
            <Select id="productId" name="productId">
              <option value="">Select product…</option>
              {activeProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Reason"
            htmlFor="reason"
            description="Internal note. Why is this access being granted?"
          >
            <Textarea id="reason" name="reason" rows={2} placeholder="e.g. Beta partner, Q1 pilot program" />
          </FormField>

          <FormField
            label="Expires at"
            htmlFor="expiresAt"
            description="Leave blank for permanent access."
          >
            <Input id="expiresAt" name="expiresAt" type="date" />
          </FormField>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">Create grant</Button>
            <a href="/admin/grants" className="text-sm text-slate-500 hover:text-slate-700">
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
