/**
 * Organization selection page.
 *
 * Shown when a user is authenticated but has no active organization.
 * This happens in two scenarios:
 *   1. User belongs to multiple orgs and hasn't selected one
 *   2. User was just invited to their first org but hasn't accepted yet
 *
 * Clerk's <OrganizationList> handles both scenarios natively:
 *   - Shows all orgs the user belongs to
 *   - Allows creating a new org if the user has no orgs
 *   - Handles org switching
 */
import { OrganizationList } from "@clerk/nextjs"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Select Organization",
}

export default function OrgSelectPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Select your workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose an organization to continue, or create a new one.
          </p>
        </div>
        <OrganizationList
          hidePersonal
          afterSelectOrganizationUrl="/"
          afterCreateOrganizationUrl="/onboarding"
        />
      </div>
    </main>
  )
}
