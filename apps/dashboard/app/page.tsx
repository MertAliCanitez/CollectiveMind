/**
 * Dashboard home page.
 *
 * Middleware guarantees:
 *   - userId is present (authenticated)
 *   - orgId is present (active org selected)
 *
 * This page calls auth() directly for defense-in-depth.
 * It does NOT trust any request parameter for orgId.
 */
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Home",
}

export default async function DashboardPage() {
  const { userId, orgId, orgSlug } = await auth()

  // Defense-in-depth: middleware should have caught these, but verify again
  if (!userId) redirect("/sign-in")
  if (!orgId) redirect("/org-select")

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome to your workspace
        </h1>
        <p className="mt-4 text-muted-foreground">
          Organization: <code className="font-mono text-xs">{orgSlug ?? orgId}</code>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {/* Product feature sections will be added here */}
          Your products and tools will appear here.
        </p>
      </div>
    </main>
  )
}
