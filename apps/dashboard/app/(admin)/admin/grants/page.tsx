import type { Metadata } from "next"
import Link from "next/link"
import { requirePlatformStaff } from "../../../../lib/auth"
import { listGrants } from "../../../../lib/admin/grants"
import { PageHeader } from "../../../../components/admin/page-header"
import { Badge } from "../../../../components/ui/badge"
import { Button } from "../../../../components/ui/button"
import { RevokeGrantButton } from "./_revoke-button"

export const metadata: Metadata = { title: "Access Grants — Admin" }

interface Props {
  searchParams: Promise<{ filter?: string }>
}

export default async function AdminGrantsPage({ searchParams }: Props) {
  await requirePlatformStaff()
  const { filter } = await searchParams

  const grants = await listGrants({ activeOnly: filter !== "all" })

  return (
    <div>
      <PageHeader
        title="Access Grants"
        description="Manual product access granted outside of subscriptions."
        action={
          <Link href="/admin/grants/new">
            <Button size="sm">+ New grant</Button>
          </Link>
        }
      />

      {/* Filter toggle */}
      <div className="mb-4 flex items-center gap-2 text-xs">
        <Link
          href="/admin/grants"
          className={
            filter !== "all"
              ? "font-semibold text-indigo-600"
              : "text-slate-500 hover:text-slate-700"
          }
        >
          Active only
        </Link>
        <span className="text-slate-300">|</span>
        <Link
          href="/admin/grants?filter=all"
          className={
            filter === "all"
              ? "font-semibold text-indigo-600"
              : "text-slate-500 hover:text-slate-700"
          }
        >
          All grants
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Granted by</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {grants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No grants found.
                </td>
              </tr>
            ) : (
              grants.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/organizations/${g.organizationId}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {g.organizationName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{g.productSlug}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-600">{g.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {g.expiresAt ? g.expiresAt.toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={g.revokedAt ? "destructive" : "success"}>
                      {g.revokedAt ? "Revoked" : "Active"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{g.grantedBy ?? "system"}</td>
                  <td className="px-4 py-3 text-right">
                    {!g.revokedAt && <RevokeGrantButton grantId={g.id} />}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
