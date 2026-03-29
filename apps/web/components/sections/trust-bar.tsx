const companies = [
  "Acme Corp",
  "Meridian Labs",
  "Northbridge",
  "Solara Systems",
  "Vantage Group",
  "Pinnacle IO",
]

export function TrustBar() {
  return (
    <section className="border-y border-white/[0.06] bg-white/[0.02] py-10 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Trusted by forward-thinking teams
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {companies.map((name) => (
            <span
              key={name}
              className="text-sm font-semibold tracking-wide text-slate-600 transition-colors hover:text-slate-400"
              aria-label={name}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
