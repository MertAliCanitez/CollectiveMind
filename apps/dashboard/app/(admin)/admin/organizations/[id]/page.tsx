import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requirePlatformStaff } from "../../../../../lib/auth"
import { getOrganization } from "../../../../../lib/admin/organizations"
import { PageHeader } from "../../../../../components/admin/page-header"
import { Badge } from "../../../../../components/ui/badge"

export const metadata: Metadata = { title: "Organization — Admin" }

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminOrgDetailPage({ params }: Props) {
  await requirePlatformStaff()
  const { id } = await params

  const org = await getOrganization(id)
  if (!org) notFound()

  return (
    <div className="space-y-8">
      <PageHeader
        title={org.name}
        description={`/${org.slug} · ID: ${org.id}`}
        breadcrumbs={[
          { label: "Organizations", href: "/admin/organizations" },
          { label: org.name },
        ]}
      />

      {/* Members */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">
          Members ({org.members.length})
        </h2>
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {org.members.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-2.5 text-zinc-300">{m.user.email}</td>
                  <td className="px-4 py-2.5 text-zinc-400">
                    {[m.user.firstName, m.user.lastName].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={m.role === "ADMIN" ? "default" : "secondary"}>{m.role}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zinc-500">
                    {m.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscriptions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">
          Subscriptions ({org.subscriptions.length})
        </h2>
        {org.subscriptions.length === 0 ? (
          <p className="text-sm text-zinc-500">No subscriptions.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Period end</th>
                  <th className="px-4 py-3">Managed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {org.subscriptions.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                      {s.productSlug}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-300">{s.planName}</td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant={
                          s.status === "ACTIVE"
                            ? "success"
                            : s.status === "CANCELED"
                              ? "destructive"
                              : "warning"
                        }
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">
                      {s.currentPeriodEnd.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={s.isManagedManually ? "warning" : "secondary"}>
                        {s.isManagedManually ? "Manual" : "Provider"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Access Grants */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">
          Access Grants ({org.grants.length})
        </h2>
        {org.grants.length === 0 ? (
          <p className="text-sm text-zinc-500">No access grants.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Granted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {org.grants.map((g) => (
                  <tr key={g.id}>
                    <td className="px-4 py-2.5 text-zinc-300">{g.productName}</td>
                    <td className="max-w-xs truncate px-4 py-2.5 text-zinc-400">
                      {g.reason ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">
                      {g.expiresAt ? g.expiresAt.toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={g.revokedAt ? "destructive" : "success"}>
                        {g.revokedAt ? "Revoked" : "Active"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">
                      {g.createdAt.toLocaleDateString()}
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
