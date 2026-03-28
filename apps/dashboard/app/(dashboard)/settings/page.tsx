import type { Metadata } from "next"
import { OrganizationProfile, UserProfile } from "@clerk/nextjs"
import { requireOrg } from "../../../lib/auth"

export const metadata: Metadata = {
  title: "Settings",
}

export default async function SettingsPage() {
  await requireOrg()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your organization and personal account.
        </p>
      </div>

      {/* Organization settings */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Organization</h2>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <OrganizationProfile
            routing="hash"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none rounded-none border-0 w-full",
                navbar: "hidden",
                pageScrollBox: "p-5",
              },
            }}
          />
        </div>
      </div>

      {/* Personal account */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Personal Account</h2>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <UserProfile
            routing="hash"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none rounded-none border-0 w-full",
                navbar: "hidden",
                pageScrollBox: "p-5",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
