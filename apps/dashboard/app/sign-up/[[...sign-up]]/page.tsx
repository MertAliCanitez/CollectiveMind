/**
 * Sign-up page.
 * Renders Clerk's hosted sign-up component at /sign-up with a custom branded
 * wrapper that matches the dashboard's design language.
 *
 * The [[...sign-up]] catch-all is required by Clerk to handle
 * OAuth callbacks and multi-step sign-up flows.
 *
 * After sign-up, Clerk redirects to /onboarding (set in ClerkProvider
 * afterSignUpUrl or NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL).
 */
import { SignUp } from "@clerk/nextjs"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create account",
}

const clerkAppearance = {
  variables: {
    colorPrimary: "#4f46e5",
    colorBackground: "#ffffff",
    colorText: "#0f172a",
    colorTextSecondary: "#64748b",
    colorInputBackground: "#ffffff",
    colorInputText: "#0f172a",
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
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-sm shadow-none h-10 rounded-lg",
    socialButtonsBlockButtonText: "font-medium",
    dividerLine: "bg-slate-200",
    dividerText: "text-slate-400 text-xs",
    formFieldLabel: "text-sm font-medium text-slate-700",
    formFieldInput:
      "h-10 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 text-sm rounded-lg",
    formButtonPrimary:
      "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm h-10 shadow-none rounded-lg transition-colors",
    footerActionText: "text-slate-500 text-sm",
    footerActionLink: "text-indigo-600 hover:text-indigo-700 font-medium",
    formFieldInputShowPasswordButton: "text-slate-400 hover:text-slate-600",
    alert: "rounded-lg",
    alertText: "text-sm",
  },
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
            <span className="text-base font-bold text-white">C</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-500">Join your organization on CollectiveMind</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <SignUp appearance={clerkAppearance} />
        </div>
      </div>
    </div>
  )
}
