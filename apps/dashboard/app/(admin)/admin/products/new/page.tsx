import type { Metadata } from "next"
import { requirePlatformAdmin } from "../../../../../lib/auth"
import { PageHeader } from "../../../../../components/admin/page-header"
import { FormField } from "../../../../../components/admin/form-field"
import { Input } from "../../../../../components/ui/input"
import { Select } from "../../../../../components/ui/select"
import { Textarea } from "../../../../../components/ui/textarea"
import { Button } from "../../../../../components/ui/button"
import { createProductAction } from "../_actions"

export const metadata: Metadata = { title: "New Product — Admin" }

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function NewProductPage({ searchParams }: Props) {
  await requirePlatformAdmin()
  const { error } = await searchParams

  return (
    <div>
      <PageHeader
        title="New Product"
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: "New" },
        ]}
      />

      <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6">
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {decodeURIComponent(error)}
          </div>
        )}
        <form action={createProductAction} className="space-y-5">
          <FormField label="Name" htmlFor="name" required>
            <Input id="name" name="name" placeholder="e.g. Insights" autoFocus />
          </FormField>

          <FormField
            label="Slug"
            htmlFor="slug"
            required
            description="URL-safe identifier. Cannot be changed after creation."
          >
            <Input id="slug" name="slug" placeholder="e.g. insights" />
          </FormField>

          <FormField label="Description" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Short internal description"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Status" htmlFor="status" required>
              <Select id="status" name="status" defaultValue="ACTIVE">
                <option value="ACTIVE">Active</option>
                <option value="COMING_SOON">Coming soon</option>
                <option value="DEPRECATED">Deprecated</option>
              </Select>
            </FormField>

            <FormField label="Sort order" htmlFor="sortOrder">
              <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={0} />
            </FormField>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">Create product</Button>
            <a href="/admin/products" className="text-sm text-slate-500 hover:text-slate-700">
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
