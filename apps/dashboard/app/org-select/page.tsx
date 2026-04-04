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
 *
 * afterSelectOrganizationUrl points directly to /home (not "/" via a redirect)
 * to avoid a double-hop and to ensure requireOrg() runs at the correct entry point.
 */
import { OrganizationList } from "@clerk/nextjs"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Select workspace",
}

const clerkAppearance = {
  variables: {
    colorPrimary: "#6366f1",
    colorBackground: "#18181b",
    colorText: "#f4f4f5",
    colorTextSecondary: "#a1a1aa",
    colorInputBackground: "#27272a",
    colorInputText: "#f4f4f5",
    borderRadius: "0.5rem",
    fontFamily: "inherit",
    fontSmoothing: "antialiased" as const,
    fontSize: "0.875rem",
  },
  elements: {
    rootBox: "w-full",
    card: "shadow-none p-0 bg-transparent border-0",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    organizationListCreateOrganizationActionButton:
      "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium text-sm rounded-lg",
    organizationListPreviewButton:
      "border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 rounded-xl",
    organizationListPreviewItemBox: "rounded-xl",
  },
}

export default function OrgSelectPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
            <span className="text-base font-bold text-white">C</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Select your workspace
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Choose an organization to continue, or create a new one.
          </p>
        </div>

        {/* Org list card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl shadow-black/20">
          <OrganizationList
            hidePersonal
            afterSelectOrganizationUrl="/home"
            afterCreateOrganizationUrl="/onboarding"
            appearance={clerkAppearance}
          />
        </div>
      </div>
    </div>
  )
}
