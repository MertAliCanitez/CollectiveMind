/**
 * apps/admin middleware.
 * All routes require authentication AND platform staff role.
 * Returns 403 for authenticated non-staff users — does NOT redirect to sign-in
 * (admin is an internal tool, not a customer-facing app).
 */
import { clerkMiddleware } from "@repo/auth"
import { isPlatformStaff } from "@repo/auth"
import { NextResponse } from "next/server"

export default clerkMiddleware(async (auth) => {
  const { userId, sessionClaims } = await auth.protect()

  if (!userId) {
    return new NextResponse(null, { status: 401 })
  }

  if (!isPlatformStaff(sessionClaims as Record<string, unknown>)) {
    return new NextResponse(
      JSON.stringify({ error: "Forbidden: platform staff access required" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
