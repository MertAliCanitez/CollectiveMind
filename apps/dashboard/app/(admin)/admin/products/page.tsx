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
        <div className="rounded-xl border border-dashed border-zinc-800 py-12 text-center text-sm text-zinc-500">
          No products yet.{" "}
          <Link href="/admin/products/new" className="text-indigo-400 hover:underline">
            Create the first one.
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Plans</th>
                <th className="px-4 py-3">Sort</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {products.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-zinc-800/50">
                  <td className="px-4 py-3 font-medium text-zinc-100">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{p.slug}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[p.status] ?? "secondary"}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{p.planCount}</td>
                  <td className="px-4 py-3 text-zinc-400">{p.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${p.id}`}
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
  )
}
