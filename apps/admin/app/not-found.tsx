import Link from "next/link"

export default function AdminNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-muted-foreground text-sm font-semibold">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground mt-6 text-base">This admin page does not exist.</p>
        <div className="mt-10">
          <Link
            href="/"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2.5 text-sm font-semibold"
          >
            Back to admin home
          </Link>
        </div>
      </div>
    </main>
  )
}
