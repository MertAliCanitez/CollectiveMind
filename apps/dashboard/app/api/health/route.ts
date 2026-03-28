/**
 * Health check endpoint for apps/dashboard.
 *
 * Used by:
 *   - Post-deploy verification (curl https://dashboard.collectivemind.com/api/health)
 *   - Uptime monitors (Checkly, Better Uptime, Vercel checks)
 *
 * The endpoint is intentionally public — no auth required.
 * It reveals only binary status, no internal data.
 *
 * Response codes:
 *   200 — app is up, DB is reachable
 *   503 — app is up, DB is unreachable (triggers alerting)
 */
import { NextResponse } from "next/server"
import { db } from "@repo/database"

export const dynamic = "force-dynamic" // never cache the health response

export async function GET(): Promise<NextResponse> {
  try {
    // Lightest possible query — just checks the connection is alive
    await db.$queryRaw`SELECT 1`

    return NextResponse.json({ ok: true, db: "connected" }, { status: 200 })
  } catch (err) {
    // Do not expose error details — the binary "disconnected" is enough
    console.error("[health] db connection failed", err)

    return NextResponse.json({ ok: false, db: "disconnected" }, { status: 503 })
  }
}
