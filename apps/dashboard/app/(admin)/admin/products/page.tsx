import type { Metadata } from "next"
import Link from "next/link"
import { requirePlatformStaff } from "../../../../lib/auth"
import { listProducts } from "../../../../lib/admin/products"
import { PageHeader } from "../../../../components/admin/page-header"
import { Badge } from "../../../../components/ui/badge"
import { Button } from "../../../../components/ui/button"

export const metadata: Metadata = { title: "Products — Admin" }

const statusVariant: Record<string, "success" | "secondary" | "destructive"> = {
  ACTIVE: "success",
  COMING_SOON: "secondary",
  DEPRECATED: "destructive",
}

export default async function AdminProductsPage() {
  await requirePlatformStaff()
  const products = await listProducts()

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage the platform product catalog."
        action={
          <Link href="/admin/products/new">
            <Button size="sm">+ New product</Button>
          </Link>
        }
      />

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
          No products yet.{" "}
          <Link href="/admin/products/new" className="text-indigo-600 hover:underline">
            Create the first one.
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Plans</th>
                <th className="px-4 py-3">Sort</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.slug}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[p.status] ?? "secondary"}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.planCount}</td>
                  <td className="px-4 py-3 text-slate-600">{p.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
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
  )
}
