"use client"

/**
 * Route-level error boundary for apps/dashboard.
 *
 * Catches unhandled errors in the React tree below the root layout.
 * The `error` prop contains the thrown error; `reset` re-renders the segment.
 *
 * This is a Client Component — Next.js requires error boundaries to be client-side.
 */
import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to the browser console in development.
    // In production, wire this to Sentry or equivalent:
    //   Sentry.captureException(error)
    console.error("[error boundary]", error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-foreground text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground mt-2">
          An unexpected error occurred. Please try again.
        </p>
        {error.digest && (
          <p className="text-muted-foreground mt-1 font-mono text-xs">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 rounded-md px-4 py-2 text-sm font-medium"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
