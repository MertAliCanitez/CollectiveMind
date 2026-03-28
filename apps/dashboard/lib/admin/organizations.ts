/**
 * Admin data layer — Organizations.
 *
 * No business logic. Pure DB queries.
 * Auth is enforced by the calling page/action via requirePlatformStaff().
 */
import { db } from "@repo/database"

export interface AdminOrg {
  id: string
  clerkId: string
  name: string
  slug: string
  memberCount: number
  subscriptionCount: number
  grantCount: number
  createdAt: Date
}

export async function listOrganizations(opts?: {
  search?: string
  page?: number
}): Promise<{ orgs: AdminOrg[]; total: number }> {
  const page = opts?.page ?? 1
  const perPage = 30
  const skip = (page - 1) * perPage

  const where = opts?.search
    ? {
        OR: [
          { name: { contains: opts.search, mode: "insensitive" as const } },
          { slug: { contains: opts.search, mode: "insensitive" as const } },
        ],
        deletedAt: null,
      }
    : { deletedAt: null }

  const [orgs, total] = await Promise.all([
    db.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      include: {
        _count: {
          select: {
            members: true,
            subscriptions: true,
            accessGrants: true,
          },
        },
      },
    }),
    db.organization.count({ where }),
  ])

  return {
    orgs: orgs.map((o) => ({
      id: o.id,
      clerkId: o.clerkId,
      name: o.name,
      slug: o.slug,
      memberCount: o._count.members,
      subscriptionCount: o._count.subscriptions,
      grantCount: o._count.accessGrants,
      createdAt: o.createdAt,
    })),
    total,
  }
}

export interface AdminOrgDetail {
  id: string
  clerkId: string
  name: string
  slug: string
  createdAt: Date
  members: {
    id: string
    role: string
    user: { id: string; email: string; firstName: string | null; lastName: string | null }
    createdAt: Date
  }[]
  subscriptions: {
    id: string
    status: string
    planName: string
    productSlug: string
    currentPeriodEnd: Date
    isManagedManually: boolean
  }[]
  grants: {
    id: string
    productName: string
    productSlug: string
    reason: string | null
    expiresAt: Date | null
    revokedAt: Date | null
    createdAt: Date
  }[]
}

export async function getOrganization(id: string): Promise<AdminOrgDetail | null> {
  const org = await db.organization.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      subscriptions: {
        include: {
          plan: { include: { product: { select: { slug: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      accessGrants: {
        include: {
          product: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!org) return null

  return {
    id: org.id,
    clerkId: org.clerkId,
    name: org.name,
    slug: org.slug,
    createdAt: org.createdAt,
    members: org.members.map((m) => ({
      id: m.id,
      role: m.role,
      user: m.user,
      createdAt: m.createdAt,
    })),
    subscriptions: org.subscriptions.map((s) => ({
      id: s.id,
      status: s.status,
      planName: s.plan.name,
      productSlug: s.plan.product.slug,
      currentPeriodEnd: s.currentPeriodEnd,
      isManagedManually: !s.providerSubscriptionId,
    })),
    grants: org.accessGrants.map((g) => ({
      id: g.id,
      productName: g.product.name,
      productSlug: g.product.slug,
      reason: g.reason,
      expiresAt: g.expiresAt,
      revokedAt: g.revokedAt,
      createdAt: g.createdAt,
    })),
  }
}
