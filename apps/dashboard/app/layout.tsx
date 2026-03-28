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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
     * ClerkProvider configuration:
     *   signInUrl / signUpUrl → where Clerk redirects unauthenticated users
     *   afterSignInUrl / afterSignUpUrl → where Clerk redirects after auth
     *
     * These can also be set via env vars:
     *   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
     *   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
     *   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
     *   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
     */
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" afterSignOutUrl="/sign-in">
      <html lang="en" className={inter.variable}>
        <body className="bg-background min-h-screen font-sans antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}
