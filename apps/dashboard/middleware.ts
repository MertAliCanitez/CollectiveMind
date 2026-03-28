/**
 * apps/dashboard middleware.
 *
 * Auth flow:
 *   1. Public routes (sign-in, sign-up, webhooks) → pass through
 *   2. Not authenticated → redirect to /sign-in
 *   3. Authenticated, no active org, not on an org-optional route → redirect to /org-select
 *   4. Authenticated with org → allow
 *
 * Security rules:
 *   - orgId is NEVER read from request params or body — only from auth()
 *   - The middleware is the first auth layer; route handlers and server
 *     components must still call auth() themselves (defense in depth)
 */
import { clerkMiddleware, createRouteMatcher } from "@repo/auth"
import { NextResponse } from "next/server"

/** Routes that do not require authentication at all. */
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
])

/**
 * Routes that require authentication but NOT an active organization.
 * Used for the post-signup flow before an org exists.
 */
const isOrgOptionalRoute = createRouteMatcher(["/onboarding(.*)"])

export default clerkMiddleware(async (auth, req) => {
  // Public routes — no auth check
  if (isPublicRoute(req)) return

  // Require authentication — redirects to /sign-in if not signed in
  const { userId, orgId } = await auth.protect()

  // Require an active org for all non-onboarding protected routes
  if (!orgId && !isOrgOptionalRoute(req)) {
    const url = req.nextUrl.clone()
    url.pathname = "/org-select"
    return NextResponse.redirect(url)
  }

  // userId is available but never passed downstream — downstream code
  // must call auth() to get it fresh from the session
  void userId
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico and common static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
