import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import "@repo/ui/globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "Dashboard — CollectiveMind",
    template: "%s — CollectiveMind",
  },
  description: "Your CollectiveMind workspace",
  robots: {
    // Dashboard is authenticated — do not index
    index: false,
    follow: false,
  },
}

/**
 * Global Clerk appearance applied at the provider level.
 *
 * This is the ONLY way to style Clerk's portaled modals (e.g. the
 * "Verification required" overlay that appears when connecting a social
 * account). Component-level `appearance` props are scoped to that
 * component's DOM subtree and do not reach React portals rendered at
 * the document root.
 */
const clerkGlobalAppearance = {
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
    // ── Portaled modal shell ─────────────────────────────────────────
    modalContent:
      "bg-zinc-900 border border-zinc-700 shadow-2xl shadow-black/60 rounded-xl",
    modalBackdrop: "bg-black/70 backdrop-blur-sm",
    modalCloseButton:
      "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg",

    // ── Form inside modals ───────────────────────────────────────────
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

    // ── Alternative methods / social inside modals ───────────────────
    alternativeMethodsBlockButton:
      "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg",
    alternativeMethodsBlockButtonText: "text-zinc-300",
    socialButtonsBlockButton:
      "border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 rounded-lg h-10",
    socialButtonsBlockButtonText: "text-zinc-200 font-medium",

    // ── Dividers ────────────────────────────────────────────────────
    dividerLine: "bg-zinc-700",
    dividerText: "text-zinc-500 text-xs",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/sign-in"
      appearance={clerkGlobalAppearance}
    >
      <html lang="en" className={`${inter.variable} dark`}>
        <body className="min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
