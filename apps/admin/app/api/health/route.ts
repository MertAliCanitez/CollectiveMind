/**
 * Health check endpoint for apps/admin.
 *
 * Used by post-deploy verification and uptime monitoring.
 * Public route — bypasses platform staff auth check in middleware.
 *
 * Response codes:
 *   200 — app is up, DB is reachable
 *   503 — app is up, DB is unreachable
 */
import { NextResponse } from "next/server"
import { db } from "@repo/database"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  try {
    await db.$queryRaw`SELECT 1`

    return NextResponse.json(
      { ok: true, db: "connected" },
      { status: 200 },
    )
  } catch (err) {
    console.error("[health] db connection failed", err)

    return NextResponse.json(
      { ok: false, db: "disconnected" },
      { status: 503 },
    )
  }
}
