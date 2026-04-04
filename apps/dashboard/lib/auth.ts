/**
 * Server-side auth utilities for apps/dashboard.
 *
 * These functions are for use in Server Components and Server Actions only.
 * They must NOT be imported in client components.
 *
 * Security principle:
 *   orgId ALWAYS comes from auth() (the JWT), never from request params.
 *   These helpers enforce that contract by returning the DB org from the
 *   Clerk org ID embedded in the session.
 */
import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db, type Organization } from "@repo/database"
import { isOrgAdmin, isOrgBillingManager, isPlatformAdmin, isPlatformStaff } from "@repo/auth"
import type { ClerkSessionClaims } from "@repo/auth"
import { logger } from "@repo/shared"

/**
 * Requires an authenticated user with an active organization.
 * Redirects to /sign-in or /org-select if either is missing.
 *
 * Returns the DB Organization record (looked up from the Clerk org ID in the JWT).
 * Use the returned `org.id` for all database queries — never use Clerk's orgId directly.
 *
 * @example
 * const { org, orgRole } = await requireOrg()
 * const products = await db.product.findMany({ where: { ... } })
 */
export async function requireOrg() {
  const { userId, orgId, orgRole } = await auth()

  if (!userId) {
    logger.warn("auth.unauthenticated", { action: "requireOrg" })
    redirect("/sign-in")
  }
  if (!orgId) {
    logger.warn("auth.no_active_org", { userId, action: "requireOrg" })
    redirect("/org-select")
  }

  let org = await db.organization.findFirst({
    where: { clerkId: orgId, deletedAt: null },
  })

  // Org not yet synced via webhook (local dev without tunnel, or delivery delay).
  // Attempt a live sync from the Clerk API before giving up.
  if (!org) {
    org = await syncOrgFromClerk(orgId)
  }

  if (!org) {
    logger.warn("auth.org_not_in_db", { userId, orgId, action: "requireOrg" })
    redirect("/org-select")
  }

  return {
    org,
    orgRole: orgRole ?? null,
  }
}

/**
 * Requires ADMIN role in the active organization.
 * Throws a 403 if the user doesn't have the required role.
 *
 * @example
 * const { org } = await requireOrgAdmin()
 */
export async function requireOrgAdmin() {
  const { org, orgRole } = await requireOrg()

  if (!isOrgAdmin(orgRole)) {
    logger.warn("auth.access_denied", { orgId: org.clerkId, orgRole, required: "org:admin" })
    redirect("/home")
  }

  return { org, orgRole }
}

/**
 * Requires ADMIN or BILLING_MANAGER role in the active organization.
 *
 * @example
 * const { org } = await requireBillingAccess()
 */
export async function requireBillingAccess() {
  const { org, orgRole } = await requireOrg()

  if (!isOrgBillingManager(orgRole)) {
    logger.warn("auth.access_denied", {
      orgId: org.clerkId,
      orgRole,
      required: "org:billing_manager",
    })
    redirect("/home")
  }

  return { org, orgRole }
}

/**
 * Requires platform-level admin role (super_admin in Clerk publicMetadata).
 * Use this for all admin/* routes — protects against org admins accessing the platform panel.
 *
 * Returns the userId of the authenticated platform admin.
 *
 * @example
 * const { userId } = await requirePlatformAdmin()
 */
export async function requirePlatformAdmin() {
  const { userId, sessionClaims } = await auth()

  if (!userId) redirect("/sign-in")

  if (!isPlatformAdmin(sessionClaims as Record<string, unknown>)) {
    logger.warn("auth.platform_access_denied", { userId, required: "super_admin" })
    redirect("/home")
  }

  return { userId }
}

/**
 * Requires platform-level staff role (super_admin or support).
 * Broader than requirePlatformAdmin — use for read-only admin views accessible to support.
 *
 * @example
 * const { userId } = await requirePlatformStaff()
 */
export async function requirePlatformStaff() {
  const { userId, sessionClaims } = await auth()

  if (!userId) redirect("/sign-in")

  if (!isPlatformStaff(sessionClaims as Record<string, unknown>)) {
    logger.warn("auth.platform_access_denied", { userId, required: "super_admin|support" })
    redirect("/home")
  }

  return { userId }
}

/**
 * Returns the current auth context without redirecting.
 * Use this when you want to conditionally render based on auth state.
 *
 * @example
 * const ctx = await getAuthContext()
 * if (!ctx) return <SignInPrompt />
 */
interface AuthContext {
  userId: string
  org: Organization
  orgRole: string | null
  sessionClaims: ClerkSessionClaims
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const { userId, orgId, orgRole, sessionClaims } = await auth()

  if (!userId || !orgId) return null

  const org = await db.organization.findFirst({
    where: { clerkId: orgId, deletedAt: null },
  })

  if (!org) return null

  return {
    userId,
    org,
    orgRole: orgRole ?? null,
    sessionClaims: sessionClaims as ClerkSessionClaims,
  }
}

/**
 * Attempts to sync an organization from the Clerk API into the local DB.
 *
 * Used as a fallback in `requireOrg()` when the org exists in the Clerk JWT
 * but hasn't arrived in the DB yet — most commonly in local development
 * without a webhook tunnel, or during webhook delivery delays.
 *
 * Returns the upserted Organization on success, null on any failure.
 */
async function syncOrgFromClerk(clerkOrgId: string): Promise<Organization | null> {
  try {
    const client = await clerkClient()
    const clerkOrg = await client.organizations.getOrganization({ organizationId: clerkOrgId })
    const slug = clerkOrg.slug ?? `org-${clerkOrgId.slice(-8)}`

    const org = await db.organization.upsert({
      where: { clerkId: clerkOrgId },
      create: { clerkId: clerkOrgId, name: clerkOrg.name, slug },
      update: { name: clerkOrg.name },
    })

    logger.info("auth.org_synced_from_clerk", { clerkOrgId, name: clerkOrg.name })
    return org
  } catch (error) {
    logger.warn("auth.org_sync_failed", { clerkOrgId, error: String(error) })
    return null
  }
}
