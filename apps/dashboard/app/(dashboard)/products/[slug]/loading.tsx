export default function ProductDetailLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Back link + header */}
      <div>
        <div className="mb-4 h-4 w-24 rounded bg-zinc-800" />
        <div className="h-7 w-48 rounded bg-zinc-800" />
        <div className="mt-2 h-4 w-64 rounded bg-zinc-800" />
      </div>

      {/* Access card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-3 h-3 w-12 rounded bg-zinc-800" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-zinc-800" />
          <div className="h-4 w-2/3 rounded bg-zinc-800" />
          <div className="h-4 w-1/2 rounded bg-zinc-800" />
        </div>
      </div>

      {/* About card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-3 h-4 w-16 rounded bg-zinc-800" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-zinc-800" />
          <div className="h-4 w-full rounded bg-zinc-800" />
          <div className="h-4 w-3/4 rounded bg-zinc-800" />
        </div>
      </div>

      {/* Workspace placeholder */}
      <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center">
        <div className="mx-auto mb-3 h-6 w-6 rounded-full bg-zinc-800" />
        <div className="mx-auto h-4 w-48 rounded bg-zinc-800" />
      </div>
    </div>
  )
}
