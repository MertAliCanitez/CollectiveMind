/**
 * Role check utilities.
 *
 * Use these functions instead of inline string comparisons so role names
 * are never scattered across the codebase.
 *
 * Clerk org role strings:   "org:admin", "org:billing_manager", "org:member"
 * Platform role strings:    "super_admin", "support"  (set in Clerk publicMetadata)
 */

/** Returns true if the Clerk org role is admin-level. */
export function isOrgAdmin(orgRole: string | null | undefined): boolean {
  return orgRole === "org:admin"
}

/** Returns true if the role can manage billing (admin or dedicated billing manager). */
export function isOrgBillingManager(orgRole: string | null | undefined): boolean {
  return orgRole === "org:admin" || orgRole === "org:billing_manager"
}

/** Returns true if the user is a platform super admin. */
export function isPlatformAdmin(
  sessionClaims: Record<string, unknown> | null | undefined,
): boolean {
  return sessionClaims?.["platformRole"] === "super_admin"
}

/** Returns true if the user is internal staff (read or write access to admin). */
export function isPlatformStaff(
  sessionClaims: Record<string, unknown> | null | undefined,
): boolean {
  const role = sessionClaims?.["platformRole"]
  return role === "super_admin" || role === "support"
}
