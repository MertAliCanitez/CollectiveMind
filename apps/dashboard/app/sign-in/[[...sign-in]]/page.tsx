/**
 * Sign-in page.
 * Renders Clerk's hosted sign-in component at /sign-in with a custom branded
 * wrapper that matches the dashboard's design language.
 *
 * The [[...sign-in]] catch-all is required by Clerk to handle
 * OAuth callbacks and multi-step sign-in flows.
 */
import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign in",
}

const clerkAppearance = {
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
    card: "shadow-none p-0 bg-transparent border-0",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium text-sm shadow-none h-10 rounded-lg",
    socialButtonsBlockButtonText: "font-medium",
    dividerLine: "bg-zinc-700",
    dividerText: "text-zinc-500 text-xs",
    formFieldLabel: "text-sm font-medium text-zinc-300",
    formFieldInput:
      "h-10 border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-indigo-500/20 text-sm rounded-lg",
    formButtonPrimary:
      "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm h-10 shadow-none rounded-lg transition-colors",
    footerActionText: "text-zinc-400 text-sm",
    footerActionLink: "text-indigo-400 hover:text-indigo-300 font-medium",
    identityPreviewText: "text-zinc-100 text-sm font-medium",
    identityPreviewEditButton: "text-indigo-400 hover:text-indigo-300",
    formFieldInputShowPasswordButton: "text-zinc-500 hover:text-zinc-300",
    alert: "rounded-lg",
    alertText: "text-sm",
  },
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
            <span className="text-base font-bold text-white">C</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Sign in to CollectiveMind
          </h1>
          <p className="mt-2 text-sm text-zinc-400">Access your organization&apos;s workspace</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl shadow-black/20">
          <SignIn appearance={clerkAppearance} />
        </div>
      </div>
    </div>
  )
}
