import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default async function AdminDashboardPage() {
  const { userId } = await auth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Admin Dashboard
        </h1>
        <p className="mt-4 text-muted-foreground">
          Internal operations panel for CollectiveMind staff.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as: <code className="font-mono text-xs">{userId}</code>
        </p>
      </div>
    </main>
  )
}
