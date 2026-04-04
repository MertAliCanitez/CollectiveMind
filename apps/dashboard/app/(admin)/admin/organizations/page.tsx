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
          className="h-9 w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        />
      </form>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3">Subscriptions</th>
              <th className="px-4 py-3">Grants</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {orgs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  No organizations found.
                </td>
              </tr>
            ) : (
              orgs.map((org) => (
                <tr key={org.id} className="transition-colors hover:bg-zinc-800/50">
                  <td className="px-4 py-3 font-medium text-zinc-100">{org.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{org.slug}</td>
                  <td className="px-4 py-3 text-zinc-400">{org.memberCount}</td>
                  <td className="px-4 py-3 text-zinc-400">{org.subscriptionCount}</td>
                  <td className="px-4 py-3 text-zinc-400">{org.grantCount}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {org.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
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
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Showing {orgs.length} of {total}
          </span>
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
