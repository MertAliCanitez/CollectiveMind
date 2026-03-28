/**
 * Sign-in page.
 * Renders Clerk's hosted sign-in component at /sign-in.
 *
 * The [[...sign-in]] catch-all is required by Clerk to handle
 * OAuth callbacks and multi-step sign-in flows.
 */
import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <SignIn />
    </main>
  )
}
