import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CollectiveMind — B2B SaaS Platform",
  description:
    "One platform for every product your B2B team needs. Unified authentication, billing, and access management.",
}

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          CollectiveMind
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          One platform. Every product your team needs.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Marketing site scaffold — build your landing page here.
        </p>
      </div>
    </main>
  )
}
