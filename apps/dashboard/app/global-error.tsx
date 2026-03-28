"use client"

/**
 * Global error boundary for apps/dashboard.
 *
 * Catches errors that escape the root layout, including layout-level errors.
 * Must include <html> and <body> because it replaces the entire document.
 *
 * Only activated in production (Next.js uses error.tsx in development).
 */
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // In production, wire this to Sentry or equivalent:
    //   Sentry.captureException(error)
    console.error("[global error boundary]", error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background px-4 font-sans">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-500">
            A critical error occurred. Please refresh the page.
          </p>
          {error.digest && (
            <p className="mt-1 font-mono text-xs text-gray-400">
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
