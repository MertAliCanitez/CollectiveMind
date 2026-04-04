import type { Metadata } from "next"
import { requirePlatformStaff } from "../../../../lib/auth"
import { listAuditLogs } from "../../../../lib/admin/audit"
import { PageHeader } from "../../../../components/admin/page-header"

export const metadata: Metadata = { title: "Audit Log — Admin" }

interface Props {
  searchParams: Promise<{ action?: string; resourceType?: string; orgId?: string; page?: string }>
}

export default async function AdminAuditPage({ searchParams }: Props) {
  await requirePlatformStaff()
  const { action, resourceType, orgId, page } = await searchParams

  const { entries, total } = await listAuditLogs({
    action,
    resourceType,
    orgId,
    page: page ? parseInt(page, 10) : 1,
  })

  return (
    <div>
      <PageHeader title="Audit Log" description={`${total} total events`} />

      {/* Filters */}
      <form method="GET" className="mb-4 flex flex-wrap gap-2">
        <input
          name="action"
          defaultValue={action}
          placeholder="Filter by action…"
          className="h-8 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        />
        <input
          name="resourceType"
          defaultValue={resourceType}
          placeholder="Resource type…"
          className="h-8 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        />
        <button
          type="submit"
          className="h-8 rounded-lg bg-zinc-800 px-3 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
        >
          Filter
        </button>
        {(action || resourceType) && (
          <a
            href="/admin/audit"
            className="flex h-8 items-center rounded-lg px-3 text-xs text-zinc-500 hover:text-zinc-300"
          >
            Clear
          </a>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <th className="whitespace-nowrap px-4 py-3">Time</th>
              <th className="whitespace-nowrap px-4 py-3">Action</th>
              <th className="whitespace-nowrap px-4 py-3">Actor</th>
              <th className="whitespace-nowrap px-4 py-3">Organization</th>
              <th className="whitespace-nowrap px-4 py-3">Resource</th>
              <th className="whitespace-nowrap px-4 py-3">Resource ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  No audit events found.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-zinc-800/50">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-zinc-500">
                    {entry.createdAt.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs font-medium text-zinc-300">
                    {entry.action}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zinc-400">
                    {entry.actorEmail ?? <span className="text-zinc-500">{entry.actorType}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zinc-400">
                    {entry.organizationName ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">
                    {entry.resourceType}
                  </td>
                  <td className="max-w-xs truncate px-4 py-2.5 font-mono text-xs text-zinc-600">
                    {entry.resourceId ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Showing {entries.length} of {total}
          </span>
          <div className="flex gap-3">
            {page && parseInt(page, 10) > 1 && (
              <a
                href={`?action=${action ?? ""}&resourceType=${resourceType ?? ""}&page=${parseInt(page, 10) - 1}`}
                className="text-indigo-400 hover:underline"
              >
                ← Prev
              </a>
            )}
            <a
              href={`?action=${action ?? ""}&resourceType=${resourceType ?? ""}&page=${parseInt(page ?? "1", 10) + 1}`}
              className="text-indigo-400 hover:underline"
            >
              Next →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
