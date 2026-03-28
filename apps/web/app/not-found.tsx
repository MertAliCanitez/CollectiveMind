import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">404</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-4 text-base text-slate-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-10">
        <Link
          href="/"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
