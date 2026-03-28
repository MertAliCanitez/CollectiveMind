/**
 * Sign-up page.
 * Renders Clerk's hosted sign-up component at /sign-up.
 *
 * The [[...sign-up]] catch-all is required by Clerk to handle
 * OAuth callbacks and multi-step sign-up flows.
 *
 * After sign-up, Clerk redirects to /onboarding (set in ClerkProvider
 * afterSignUpUrl or NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL).
 */
import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <SignUp />
    </main>
  )
}
