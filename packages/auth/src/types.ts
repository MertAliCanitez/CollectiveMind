/**
 * Typed session claims for CollectiveMind.
 *
 * These extend the base Clerk session token with fields we inject via
 * the Clerk dashboard "Customize session token" configuration.
 *
 * How to configure in Clerk dashboard:
 *   Configure → Sessions → Edit → Customize session token
 *   Add: { "platformRole": "{{user.public_metadata.platformRole}}" }
 */

export type PlatformRole = "super_admin" | "support"

/**
 * Custom claims added to every JWT issued by Clerk.
 * Injected via the session token customization in the Clerk dashboard.
 */
export interface CustomSessionClaims {
  /** Present only for internal staff. Absent means regular user. */
  platformRole?: PlatformRole
}

/**
 * Full session claims object as it arrives from Clerk.
 * Use `sessionClaims` from `auth()` and cast to this type after validation.
 *
 * @example
 * const { sessionClaims } = await auth()
 * const claims = sessionClaims as ClerkSessionClaims
 * if (claims.platformRole === "super_admin") { ... }
 */
export interface ClerkSessionClaims extends CustomSessionClaims {
  /** Clerk user ID */
  sub: string
  /** Token issue time */
  iat: number
  /** Token expiry time */
  exp: number
  /** Active organization ID (present when user has an active org) */
  org_id?: string
  /** Active organization role (present when user has an active org) */
  org_role?: string
  /** Active organization slug */
  org_slug?: string
}
