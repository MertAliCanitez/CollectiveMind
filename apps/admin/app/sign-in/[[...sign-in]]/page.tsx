/**
 * Admin sign-in page.
 *
 * After sign-in, Clerk redirects back to the admin panel.
 * The middleware then checks for platform staff role and returns 403 if not present.
 *
 * The sign-in page itself is public (accessible to anyone who knows the URL).
 * Access control is enforced by middleware AFTER authentication.
 */
import { SignIn } from "@clerk/nextjs"

export default function AdminSignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-sm text-muted-foreground">Internal staff access only</p>
        </div>
        <SignIn afterSignInUrl="/" />
      </div>
    </main>
  )
}
