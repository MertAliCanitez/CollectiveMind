import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "@/components/ui/icons"
import { cn } from "@repo/ui"

interface HeroProps {
  eyebrow?: string
  headline: string
  subheadline: string
  ctaPrimary: { label: string; href: string }
  ctaSecondary?: { label: string; href: string }
  dark?: boolean
}

export function Hero({
  eyebrow,
  headline,
  subheadline,
  ctaPrimary,
  ctaSecondary,
  dark = false,
}: HeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        dark
          ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
          : "bg-white",
      )}
    >
      {/* Subtle grid pattern for dark hero */}
      {dark && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      )}

      {/* Indigo glow behind hero text */}
      {dark && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-indigo-600 opacity-[0.07] blur-3xl" />
      )}

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-widest",
                  dark ? "text-indigo-300" : "text-indigo-600",
                )}
              >
                {eyebrow}
              </span>
            </div>
          )}

          <h1
            className={cn(
              "text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl",
              dark ? "text-white" : "text-slate-900",
            )}
          >
            {headline}
          </h1>

          <p
            className={cn(
              "mt-6 text-lg leading-relaxed sm:text-xl",
              dark ? "text-slate-300" : "text-slate-600",
            )}
          >
            {subheadline}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href={ctaPrimary.href} className="flex items-center gap-2">
                {ctaPrimary.label}
                <ArrowRight size={16} />
              </Link>
            </Button>

            {ctaSecondary && (
              <Button
                variant={dark ? "outline" : "secondary"}
                size="lg"
                asChild
                className={
                  dark
                    ? "border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600"
                    : undefined
                }
              >
                <Link href={ctaSecondary.href}>{ctaSecondary.label}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
