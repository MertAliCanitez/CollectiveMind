import type { Metadata } from "next"
import { OrganizationProfile, UserProfile } from "@clerk/nextjs"
import { requireOrg } from "../../../lib/auth"

export const metadata: Metadata = {
  title: "Settings",
}

const clerkDarkAppearance = {
  variables: {
    colorPrimary: "#6366f1",
    colorBackground: "#18181b",
    colorText: "#f4f4f5",
    colorTextSecondary: "#a1a1aa",
    colorInputBackground: "#27272a",
    colorInputText: "#f4f4f5",
    colorDanger: "#ef4444",
    borderRadius: "0.5rem",
    fontFamily: "inherit",
    fontSmoothing: "antialiased" as const,
    fontSize: "0.875rem",
  },
  elements: {
    rootBox: "w-full",
    card: "shadow-none rounded-none border-0 w-full bg-transparent",
    pageScrollBox: "p-5",
  },
}

export default async function SettingsPage() {
  await requireOrg()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your organization and personal account.
        </p>
      </div>

      {/* Organization settings */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-zinc-300">Organization</h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          <OrganizationProfile
            routing="hash"
            appearance={clerkDarkAppearance}
          />
        </div>
      </div>

      {/* Personal account */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-zinc-300">Personal Account</h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          <UserProfile
            routing="hash"
            appearance={clerkDarkAppearance}
          />
        </div>
      </div>
    </div>
  )
}
