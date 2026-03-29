import Link from "next/link"
import { ArrowRight } from "@/components/ui/icons"

interface HeroProps {
  eyebrow?: string
  headline: string
  subheadline: string
  ctaPrimary: { label: string; href: string }
  ctaSecondary?: { label: string; href: string }
  dark?: boolean
}

export function Hero({ eyebrow, headline, subheadline, ctaPrimary, ctaSecondary }: HeroProps) {
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-[#07070f]">
      {/* ── Ambient glow orbs ─────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Blue — top-left */}
        <div
          className="absolute -left-48 -top-48 h-[640px] w-[640px] rounded-full bg-blue-600/20 blur-[130px]"
          style={{ animation: "glow-pulse 9s ease-in-out infinite" }}
        />
        {/* Violet — center */}
        <div
          className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.18] blur-[120px]"
          style={{ animation: "glow-pulse 12s ease-in-out infinite 1.5s" }}
        />
        {/* Fuchsia — bottom-right */}
        <div
          className="absolute -bottom-24 -right-24 h-[420px] w-[420px] rounded-full bg-fuchsia-600/[0.14] blur-[110px]"
          style={{ animation: "glow-pulse 10s ease-in-out infinite 3s" }}
        />
        {/* Cyan — top-right accent */}
        <div
          className="absolute -top-16 right-1/4 h-[280px] w-[280px] rounded-full bg-cyan-500/10 blur-[90px]"
          style={{ animation: "glow-pulse 8s ease-in-out infinite 0.5s" }}
        />
        {/* Orange — bottom-left accent */}
        <div
          className="absolute bottom-1/4 left-[8%] h-[220px] w-[220px] rounded-full bg-orange-500/[0.08] blur-[80px]"
          style={{ animation: "glow-pulse 14s ease-in-out infinite 2s" }}
        />
      </div>

      {/* ── Grid pattern ──────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* ── Floating neural nodes ─────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Blue cluster — left side */}
        <div
          className="absolute left-[11%] top-[17%] h-[11px] w-[11px] rounded-full bg-blue-400"
          style={{
            boxShadow: "0 0 14px 4px rgba(96,165,250,0.7)",
            animation: "neural-float 7s ease-in-out infinite",
          }}
        />
        <div
          className="absolute left-[6%] top-[37%] h-[7px] w-[7px] rounded-full bg-blue-500"
          style={{
            boxShadow: "0 0 9px 2px rgba(59,130,246,0.5)",
            animation: "neural-float 9.5s ease-in-out infinite 1.2s",
          }}
        />
        <div
          className="absolute left-[15%] top-[60%] h-[9px] w-[9px] rounded-full bg-cyan-400"
          style={{
            boxShadow: "0 0 11px 3px rgba(34,211,238,0.55)",
            animation: "neural-float 8s ease-in-out infinite 2.1s",
          }}
        />
        <div
          className="absolute left-[27%] top-[79%] h-[6px] w-[6px] rounded-full bg-blue-300 opacity-60"
          style={{ animation: "neural-float 11s ease-in-out infinite 0.8s" }}
        />
        {/* Violet / fuchsia cluster — right side */}
        <div
          className="absolute right-[13%] top-[21%] h-[11px] w-[11px] rounded-full bg-violet-400"
          style={{
            boxShadow: "0 0 14px 4px rgba(167,139,250,0.7)",
            animation: "neural-float 6.5s ease-in-out infinite 0.4s",
          }}
        />
        <div
          className="absolute right-[8%] top-[46%] h-[8px] w-[8px] rounded-full bg-violet-500"
          style={{
            boxShadow: "0 0 10px 3px rgba(139,92,246,0.5)",
            animation: "neural-float 10s ease-in-out infinite 1.7s",
          }}
        />
        <div
          className="absolute right-[18%] top-[67%] h-[9px] w-[9px] rounded-full bg-fuchsia-400"
          style={{
            boxShadow: "0 0 11px 3px rgba(232,121,249,0.55)",
            animation: "neural-float 7.5s ease-in-out infinite 3.1s",
          }}
        />
        {/* Orange accent — upper center-right */}
        <div
          className="absolute right-[36%] top-[11%] h-[7px] w-[7px] rounded-full bg-orange-400"
          style={{
            boxShadow: "0 0 9px 2px rgba(251,146,60,0.55)",
            animation: "neural-float 12s ease-in-out infinite 2.4s",
          }}
        />
        {/* Faint bottom nodes */}
        <div
          className="absolute right-[30%] top-[83%] h-[6px] w-[6px] rounded-full bg-fuchsia-300 opacity-50"
          style={{ animation: "neural-float 9s ease-in-out infinite 1.1s" }}
        />
        <div
          className="absolute left-[42%] top-[50%] h-[5px] w-[5px] rounded-full bg-cyan-300 opacity-40"
          style={{ animation: "neural-float 13s ease-in-out infinite 4s" }}
        />
      </div>

      {/* ── Hero content ──────────────────────────────────────────────────── */}
      <div className="relative mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 sm:py-40 lg:px-8 lg:py-48">
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow badge */}
          {eyebrow && (
            <div
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-1.5 backdrop-blur-sm"
              style={{ animation: "fade-in-up 0.6s ease-out both" }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full bg-blue-400"
                style={{ animation: "glow-dot 2.5s ease-in-out infinite" }}
              />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
                {eyebrow}
              </span>
            </div>
          )}

          {/* Headline */}
          <h1
            className="text-5xl font-bold leading-[1.06] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-[5.5rem]"
            style={{ animation: "fade-in-up 0.7s ease-out 0.1s both" }}
          >
            {headline}
          </h1>

          {/* Subheadline */}
          <p
            className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl"
            style={{ animation: "fade-in-up 0.7s ease-out 0.22s both" }}
          >
            {subheadline}
          </p>

          {/* CTA buttons */}
          <div
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animation: "fade-in-up 0.7s ease-out 0.34s both" }}
          >
            {/* Primary — gradient */}
            <Link
              href={ctaPrimary.href}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-violet-600 to-fuchsia-600 px-8 py-3.5 text-[0.95rem] font-semibold text-white shadow-[0_0_36px_rgba(99,102,241,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_0_52px_rgba(99,102,241,0.6)]"
            >
              {ctaPrimary.label}
              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>

            {/* Secondary — glass */}
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
      </div>

      {/* Bottom fade into next section */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#07070f] to-transparent" />
    </section>
  )
}
