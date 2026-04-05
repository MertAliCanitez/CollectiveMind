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
    colorNeutral: "#f4f4f5",
    borderRadius: "0.5rem",
    fontFamily: "inherit",
    fontSmoothing: "antialiased" as const,
    fontSize: "0.875rem",
  },
  elements: {
    // Layout
    rootBox: "w-full",
    card: "shadow-none rounded-none border-0 w-full bg-transparent",
    pageScrollBox: "p-5",

    // Badges — fix "Google" text invisible on dark bg
    badge: "bg-zinc-700 text-zinc-200 border border-zinc-600",

    // Social / provider buttons (connected accounts list)
    socialButtonsBlockButton:
      "border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 rounded-lg h-10",
    socialButtonsBlockButtonText: "text-zinc-200 font-medium",
    socialButtonsBlockButtonArrow: "text-zinc-400",

    // Profile section action links
    profileSectionPrimaryButton:
      "text-indigo-400 hover:text-indigo-300 font-medium text-sm",
    profileSectionContent__connectedAccounts: "text-zinc-100",

    // Form elements (used inside both inline sections and modals)
    formHeaderTitle: "text-zinc-100 text-lg font-semibold",
    formHeaderSubtitle: "text-zinc-400 text-sm",
    formFieldLabel: "text-zinc-300 text-sm font-medium",
    formFieldHintText: "text-zinc-500 text-xs",
    formFieldInput:
      "h-10 rounded-lg border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500",
    formFieldInputShowPasswordButton: "text-zinc-500 hover:text-zinc-300",
    formButtonPrimary:
      "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-lg h-10 shadow-none transition-colors",
    formButtonReset:
      "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg font-medium text-sm",
    formResendCodeLink: "text-indigo-400 hover:text-indigo-300 font-medium",
    alternativeMethodsBlockButton:
      "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg",
    alternativeMethodsBlockButtonText: "text-zinc-300",

    // Modals — "Verification required" and any other Clerk-triggered overlays
    modalContent:
      "bg-zinc-900 border border-zinc-700 shadow-2xl shadow-black/60 rounded-xl",
    modalBackdrop: "bg-black/70 backdrop-blur-sm",
    modalCloseButton: "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg",

    // Dividers
    dividerLine: "bg-zinc-700",
    dividerText: "text-zinc-500 text-xs",

    // Action links
    actionCard: "bg-zinc-800 border border-zinc-700 rounded-xl",
    actionCardContent: "text-zinc-300",
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
          <OrganizationProfile routing="hash" appearance={clerkDarkAppearance} />
        </div>
      </div>

      {/* Personal account */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-zinc-300">Personal Account</h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          <UserProfile routing="hash" appearance={clerkDarkAppearance} />
        </div>
      </div>
    </div>
  )
}
