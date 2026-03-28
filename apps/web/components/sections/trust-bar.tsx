// Placeholder trust bar — replace company names with real customer logos
// when logos are available.

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
    <section className="border-y border-slate-200 bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-sm font-medium text-slate-400">
          Trusted by teams at forward-thinking companies
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {companies.map((name) => (
            <span
              key={name}
              className="text-sm font-semibold tracking-wide text-slate-400 opacity-60"
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
