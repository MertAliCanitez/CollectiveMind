/**
 * Admin data layer — Audit Logs.
 *
 * The AuditLog model is append-only. Queries are read-only.
 * writeAdminAuditLog is used by admin Server Actions to record mutations.
 * Auth is enforced by the calling page/action via requirePlatformStaff/requirePlatformAdmin().
 */
import { db, type Prisma } from "@repo/database"

// ─── Writer ──────────────────────────────────────────────────────────────────

/**
 * Resolve the internal DB user ID from a Clerk user ID.
 * Returns null if the user hasn't been synced yet (race) or doesn't exist.
 */
export async function resolveDbUserId(clerkUserId: string | null | undefined): Promise<string | null> {
  if (!clerkUserId) return null
  const user = await db.user.findFirst({ where: { clerkId: clerkUserId }, select: { id: true } })
  return user?.id ?? null
}

/**
 * Write an admin audit log entry.
 * Call this in every admin Server Action that mutates platform data.
 * Failures are intentionally swallowed — a broken audit write must not block the user action.
 */
export async function writeAdminAuditLog(opts: {
  actorDbUserId: string | null
  action: string
  resourceType: string
  resourceId?: string | null
  organizationId?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorUserId: opts.actorDbUserId,
        actorType: "ADMIN",
        action: opts.action,
        resourceType: opts.resourceType,
        resourceId: opts.resourceId ?? null,
        organizationId: opts.organizationId ?? null,
        metadata: (opts.metadata ?? {}) as Prisma.InputJsonObject,
      },
    })
  } catch {
    // Audit log failure must not break the primary action.
    // In production, Sentry would capture this.
  }
}

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
