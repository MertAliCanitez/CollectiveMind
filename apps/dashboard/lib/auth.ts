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
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db, type Organization } from "@repo/database"
import { isOrgAdmin, isOrgBillingManager } from "@repo/auth"
import type { ClerkSessionClaims } from "@repo/auth"

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

  if (!userId) redirect("/sign-in")
  if (!orgId) redirect("/org-select")

  const org = await db.organization.findFirst({
    where: { clerkId: orgId, deletedAt: null },
  })

  // Org exists in Clerk session but hasn't been synced to DB yet
  // (race condition: user logged in before webhook arrived)
  if (!org) redirect("/org-select")

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
    // Return 403 as a Next.js error — or redirect to a "not authorized" page
    // Using redirect here keeps the UX clean; for API routes throw instead
    redirect("/")
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
    redirect("/")
  }

  return { org, orgRole }
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
