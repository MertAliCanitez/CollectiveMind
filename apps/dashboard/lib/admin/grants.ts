/**
 * Admin data layer — Access Grants.
 *
 * No business logic. Pure DB queries and mutations.
 * Auth is enforced by the calling page/action via requirePlatformAdmin().
 */
import { db, type AccessGrant } from "@repo/database"

export interface AdminGrant {
  id: string
  organizationName: string
  organizationSlug: string
  organizationId: string
  productName: string
  productSlug: string
  productId: string
  reason: string | null
  expiresAt: Date | null
  revokedAt: Date | null
  grantedBy: string | null
  createdAt: Date
}

export async function listGrants(opts?: {
  orgId?: string
  activeOnly?: boolean
}): Promise<AdminGrant[]> {
  const where: Record<string, unknown> = {}

  if (opts?.orgId) {
    where["organizationId"] = opts.orgId
  }

  if (opts?.activeOnly) {
    where["revokedAt"] = null
  }

  const grants = await db.accessGrant.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { name: true, slug: true } },
      product: { select: { name: true, slug: true } },
      grantedBy: { select: { email: true } },
    },
  })

  return grants.map((g) => ({
    id: g.id,
    organizationName: g.organization.name,
    organizationSlug: g.organization.slug,
    organizationId: g.organizationId,
    productName: g.product.name,
    productSlug: g.product.slug,
    productId: g.productId,
    reason: g.reason,
    expiresAt: g.expiresAt,
    revokedAt: g.revokedAt,
    grantedBy: g.grantedBy?.email ?? null,
    createdAt: g.createdAt,
  }))
}

export interface CreateGrantInput {
  organizationId: string
  productId: string
  grantedByUserId?: string
  reason?: string
  expiresAt?: Date
}

export async function createGrant(data: CreateGrantInput): Promise<AccessGrant> {
  return db.accessGrant.create({
    data: {
      organizationId: data.organizationId,
      productId: data.productId,
      grantedByUserId: data.grantedByUserId,
      reason: data.reason ?? null,
      expiresAt: data.expiresAt ?? null,
    },
  })
}

export async function revokeGrant(id: string): Promise<AccessGrant> {
  return db.accessGrant.update({
    where: { id },
    data: { revokedAt: new Date() },
  })
}
