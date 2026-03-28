/**
 * apps/web middleware.
 * The marketing site is fully public — no auth required.
 * This middleware only handles redirects and security headers.
 * Auth headers are applied in next.config.ts.
 */
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(_req: NextRequest): NextResponse {
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
