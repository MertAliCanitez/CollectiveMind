import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requirePlatformStaff } from "../../../../../lib/auth"
import { getProduct } from "../../../../../lib/admin/products"
import { listPlansForProduct } from "../../../../../lib/admin/plans"
import { PageHeader } from "../../../../../components/admin/page-header"
import { FormField } from "../../../../../components/admin/form-field"
import { Input } from "../../../../../components/ui/input"
import { Select } from "../../../../../components/ui/select"
import { Textarea } from "../../../../../components/ui/textarea"
import { Button } from "../../../../../components/ui/button"
import { Badge } from "../../../../../components/ui/badge"
import { updateProductAction } from "../_actions"

export const metadata: Metadata = { title: "Edit Product — Admin" }

const statusVariant: Record<string, "success" | "secondary" | "destructive"> = {
  ACTIVE: "success",
  LEGACY: "secondary",
  DEPRECATED: "destructive",
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  await requirePlatformStaff()
  const { id } = await params

  const [product, plans] = await Promise.all([getProduct(id), listPlansForProduct(id)])

  if (!product) notFound()

  const updateAction = updateProductAction.bind(null, id)

  return (
    <div className="space-y-8">
      <PageHeader
        title={product.name}
        description={`Product ID: ${product.id}`}
        breadcrumbs={[{ label: "Products", href: "/admin/products" }, { label: product.name }]}
      />

      {/* Edit form */}
      <div className="max-w-xl rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-5 text-sm font-semibold text-zinc-300">Product details</h2>
        <form action={updateAction} className="space-y-5">
          <FormField label="Name" htmlFor="name" required>
            <Input id="name" name="name" defaultValue={product.name} />
          </FormField>

          <FormField label="Slug" htmlFor="slug" description="Read-only after creation.">
            <Input id="slug" name="slug" defaultValue={product.slug} disabled />
          </FormField>

          <FormField label="Description" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={product.description ?? ""}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Status" htmlFor="status" required>
              <Select id="status" name="status" defaultValue={product.status}>
                <option value="ACTIVE">Active</option>
                <option value="COMING_SOON">Coming soon</option>
                <option value="DEPRECATED">Deprecated</option>
              </Select>
            </FormField>

            <FormField label="Sort order" htmlFor="sortOrder">
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={product.sortOrder}
              />
            </FormField>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </div>

      {/* Plans table */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Plans ({plans.length})</h2>
          <Link href={`/admin/products/${id}/plans/new`}>
            <Button size="sm" variant="outline">
              + Add plan
            </Button>
          </Link>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 py-10 text-center text-sm text-zinc-500">
            No plans yet.{" "}
            <Link
              href={`/admin/products/${id}/plans/new`}
              className="text-indigo-400 hover:underline"
            >
              Create the first plan.
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Interval</th>
                  <th className="px-4 py-3">Price (¢)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Public</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {plans.map((plan) => (
                  <tr key={plan.id} className="transition-colors hover:bg-zinc-800/50">
                    <td className="px-4 py-3 font-medium text-zinc-100">{plan.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{plan.slug}</td>
                    <td className="px-4 py-3 text-zinc-400">{plan.billingInterval}</td>
                    <td className="px-4 py-3 text-zinc-400">{plan.displayPrice}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[plan.status] ?? "secondary"}>
                        {plan.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={plan.isPublic ? "success" : "secondary"}>
                        {plan.isPublic ? "Yes" : "No"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/products/${id}/plans/${plan.id}`}
                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                      >
                        Edit →
                      </Link>
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
