import type { Metadata } from "next"
import Link from "next/link"
import { requirePlatformStaff } from "../../../../lib/auth"
import { listOrganizations } from "../../../../lib/admin/organizations"
import { PageHeader } from "../../../../components/admin/page-header"

export const metadata: Metadata = { title: "Organizations — Admin" }

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function AdminOrgsPage({ searchParams }: Props) {
  await requirePlatformStaff()
  const { q, page } = await searchParams

  const { orgs, total } = await listOrganizations({
    search: q,
    page: page ? parseInt(page, 10) : 1,
  })

  return (
    <div>
      <PageHeader title="Organizations" description={`${total} total`} />

      {/* Search */}
      <form method="GET" className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or slug…"
          className="h-9 w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        />
      </form>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3">Subscriptions</th>
              <th className="px-4 py-3">Grants</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orgs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No organizations found.
                </td>
              </tr>
            ) : (
              orgs.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{org.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{org.slug}</td>
                  <td className="px-4 py-3 text-slate-600">{org.memberCount}</td>
                  <td className="px-4 py-3 text-slate-600">{org.subscriptionCount}</td>
                  <td className="px-4 py-3 text-slate-600">{org.grantCount}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {org.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 30 && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {orgs.length} of {total}</span>
          <div className="flex gap-2">
            {page && parseInt(page, 10) > 1 && (
              <Link
                href={`?q=${q ?? ""}&page=${parseInt(page, 10) - 1}`}
                className="text-indigo-600 hover:underline"
              >
                ← Prev
              </Link>
            )}
            <Link
              href={`?q=${q ?? ""}&page=${parseInt(page ?? "1", 10) + 1}`}
              className="text-indigo-600 hover:underline"
            >
              Next →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
