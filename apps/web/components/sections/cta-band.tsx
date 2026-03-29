import Link from "next/link"
import { ArrowRight } from "@/components/ui/icons"

interface CtaBandProps {
  heading: string
  subheading?: string
  ctaPrimary: { label: string; href: string }
  ctaSecondary?: { label: string; href: string }
}

export function CtaBand({ heading, subheading, ctaPrimary, ctaSecondary }: CtaBandProps) {
  return (
    <section className="relative overflow-hidden bg-[#07070f] py-24 sm:py-32">
      {/* Strong glow orbs — more intense than hero */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/25 blur-[110px]"
          style={{ animation: "glow-pulse 8s ease-in-out infinite" }}
        />
        <div
          className="bg-fuchsia-600/18 absolute -top-10 right-0 h-[400px] w-[400px] rounded-full blur-[90px]"
          style={{ animation: "glow-pulse 10s ease-in-out infinite 1s" }}
        />
        <div
          className="bg-blue-600/18 absolute -bottom-10 left-0 h-[400px] w-[400px] rounded-full blur-[90px]"
          style={{ animation: "glow-pulse 11s ease-in-out infinite 2s" }}
        />
      </div>

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Top separator glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* Eyebrow */}
        <p className="mb-6 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-xs font-semibold uppercase tracking-[0.18em] text-transparent">
          Get started today
        </p>

        {/* Heading */}
        <h2 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          {heading}
        </h2>

        {subheading && (
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">{subheading}</p>
        )}

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={ctaPrimary.href}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-violet-600 to-fuchsia-600 px-8 py-3.5 text-[0.95rem] font-semibold text-white shadow-[0_0_40px_rgba(99,102,241,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_0_60px_rgba(99,102,241,0.65)]"
          >
            {ctaPrimary.label}
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>

          {ctaSecondary && (
            <Link
              href={ctaSecondary.href}
              className="inline-flex items-center rounded-xl border border-white/[0.14] bg-white/5 px-8 py-3.5 text-[0.95rem] font-semibold text-slate-300 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.09] hover:text-white"
            >
              {ctaSecondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
