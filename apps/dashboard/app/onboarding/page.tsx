/**
 * Onboarding page.
 *
 * Shown after a new organization is created (redirected from OrganizationList
 * afterCreateOrganizationUrl="/onboarding").
 *
 * At v1, onboarding is minimal:
 *   - Welcome message with org name
 *   - Prompt to wait for staff to activate a subscription
 *   - Link to the dashboard
 *
 * Post-MVP: This becomes a multi-step product selection + billing setup flow.
 *
 * Auth:
 *   - Requires authentication (middleware guarantees userId)
 *   - Does NOT require an active org (middleware isOrgOptionalRoute)
 *   - Still calls auth() directly for defense-in-depth
 */
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Welcome",
}

export default async function OnboardingPage() {
  const { userId, orgId, orgSlug } = await auth()

  if (!userId) redirect("/sign-in")

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <h1 className="text-foreground text-3xl font-bold">
          {orgId ? `Welcome to ${orgSlug ?? "your workspace"}` : "Welcome to CollectiveMind"}
        </h1>

        {orgId ? (
          <>
            <p className="text-muted-foreground mt-4">
              Your organization has been created. A member of our team will activate your
              subscription shortly.
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              You&apos;ll receive an email when your account is ready.
            </p>
            <Link href="/" className="mt-6 inline-flex items-center text-sm font-medium underline">
              Go to dashboard →
            </Link>
          </>
        ) : (
          <>
            <p className="text-muted-foreground mt-4">
              You don&apos;t have an organization yet. Create or join one to continue.
            </p>
            <Link
              href="/org-select"
              className="mt-6 inline-flex items-center text-sm font-medium underline"
            >
              Select or create an organization →
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
