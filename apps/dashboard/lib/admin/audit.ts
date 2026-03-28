/**
 * Admin data layer — Audit Logs.
 *
 * The AuditLog model is append-only. No mutations here — only queries.
 * Auth is enforced by the calling page/action via requirePlatformStaff().
 */
import { db } from "@repo/database"

export interface AdminAuditEntry {
  id: string
  action: string
  actorType: string
  actorEmail: string | null
  organizationName: string | null
  organizationId: string | null
  resourceType: string
  resourceId: string | null
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: Date
}

export async function listAuditLogs(opts?: {
  orgId?: string
  action?: string
  resourceType?: string
  page?: number
}): Promise<{ entries: AdminAuditEntry[]; total: number }> {
  const page = opts?.page ?? 1
  const perPage = 50
  const skip = (page - 1) * perPage

  const where: Record<string, unknown> = {}
  if (opts?.orgId) where["organizationId"] = opts.orgId
  if (opts?.action) where["action"] = { contains: opts.action, mode: "insensitive" }
  if (opts?.resourceType) where["resourceType"] = opts.resourceType

  const [entries, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      include: {
        actor: { select: { email: true } },
        organization: { select: { name: true } },
      },
    }),
    db.auditLog.count({ where }),
  ])

  return {
    entries: entries.map((e) => ({
      id: e.id,
      action: e.action,
      actorType: e.actorType,
      actorEmail: e.actor?.email ?? null,
      organizationName: e.organization?.name ?? null,
      organizationId: e.organizationId,
      resourceType: e.resourceType,
      resourceId: e.resourceId,
      metadata: (e.metadata as Record<string, unknown>) ?? null,
      ipAddress: e.ipAddress,
      createdAt: e.createdAt,
    })),
    total,
  }
}
