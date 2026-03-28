import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Not Found",
}

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          Go to dashboard
        </Link>
      </div>
    </main>
  )
}
