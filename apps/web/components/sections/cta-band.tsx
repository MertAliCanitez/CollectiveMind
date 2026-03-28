import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "@/components/ui/icons"

interface CtaBandProps {
  heading: string
  subheading?: string
  ctaPrimary: { label: string; href: string }
  ctaSecondary?: { label: string; href: string }
}

export function CtaBand({ heading, subheading, ctaPrimary, ctaSecondary }: CtaBandProps) {
  return (
    <section className="bg-gradient-to-br from-slate-900 to-indigo-950 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{heading}</h2>
        {subheading && <p className="mt-4 text-lg text-slate-300">{subheading}</p>}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild className="bg-indigo-500 shadow-md hover:bg-indigo-400">
            <Link href={ctaPrimary.href} className="flex items-center gap-2">
              {ctaPrimary.label}
              <ArrowRight size={16} />
            </Link>
          </Button>
          {ctaSecondary && (
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-slate-700 bg-transparent text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            >
              <Link href={ctaSecondary.href}>{ctaSecondary.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
