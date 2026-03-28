import { cn } from "@repo/ui"
import { SectionHeader } from "@/components/sections/section-header"

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

interface FeatureHighlightsProps {
  eyebrow?: string
  heading: string
  subheading?: string
  features: Feature[]
  background?: "white" | "slate"
}

export function FeatureHighlights({
  eyebrow,
  heading,
  subheading,
  features,
  background = "white",
}: FeatureHighlightsProps) {
  return (
    <section className={cn("py-24 sm:py-32", background === "slate" ? "bg-slate-50" : "bg-white")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow={eyebrow} heading={heading} subheading={subheading} />

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
