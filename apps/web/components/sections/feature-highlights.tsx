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

// Staggered icon colors cycling through the logo's spectrum
const iconStyles = [
  {
    wrapper: "bg-blue-500/10 group-hover:bg-blue-500/18",
    icon: "text-blue-400",
    glow: "group-hover:shadow-[0_0_20px_rgba(96,165,250,0.4)]",
  },
  {
    wrapper: "bg-violet-500/10 group-hover:bg-violet-500/18",
    icon: "text-violet-400",
    glow: "group-hover:shadow-[0_0_20px_rgba(167,139,250,0.4)]",
  },
  {
    wrapper: "bg-fuchsia-500/10 group-hover:bg-fuchsia-500/18",
    icon: "text-fuchsia-400",
    glow: "group-hover:shadow-[0_0_20px_rgba(232,121,249,0.4)]",
  },
  {
    wrapper: "bg-cyan-500/10 group-hover:bg-cyan-500/18",
    icon: "text-cyan-400",
    glow: "group-hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]",
  },
  {
    wrapper: "bg-orange-500/10 group-hover:bg-orange-500/18",
    icon: "text-orange-400",
    glow: "group-hover:shadow-[0_0_20px_rgba(251,146,60,0.4)]",
  },
  {
    wrapper: "bg-blue-500/10 group-hover:bg-blue-500/18",
    icon: "text-blue-400",
    glow: "group-hover:shadow-[0_0_20px_rgba(96,165,250,0.4)]",
  },
] as const

export function FeatureHighlights({
  eyebrow,
  heading,
  subheading,
  features,
}: FeatureHighlightsProps) {
  return (
    <section className="relative bg-[#07070f] py-24 sm:py-32">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px]"
          style={{ animation: "glow-pulse 14s ease-in-out infinite" }}
        />
        <div
          className="bg-blue-600/8 absolute right-1/4 top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full blur-[100px]"
          style={{ animation: "glow-pulse 16s ease-in-out infinite 2s" }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow={eyebrow} heading={heading} subheading={subheading} />

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const style = iconStyles[i % iconStyles.length]!
            return (
              <div
                key={i}
                className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.13] hover:bg-white/[0.045] hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
                style={{ animation: `card-reveal 0.5s ease-out ${i * 0.07}s both` }}
              >
                {/* Top shimmer line on hover */}
                <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Icon */}
                <div
                  className={cn(
                    "mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                    style.wrapper,
                    style.glow,
                  )}
                >
                  <span className={cn("transition-colors duration-300", style.icon)}>
                    {feature.icon}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
