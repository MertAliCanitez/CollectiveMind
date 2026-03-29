import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How CollectiveMind uses cookies and similar tracking technologies.",
}

const cookieTypes = [
  {
    name: "Strictly necessary cookies",
    purpose: "Required for the platform to function. These cannot be disabled.",
    examples: "Session management, authentication tokens, security tokens.",
    canOptOut: false,
  },
  {
    name: "Analytics cookies",
    purpose: "Help us understand how visitors interact with our website so we can improve it.",
    examples: "Page views, time on site, referral sources.",
    canOptOut: true,
  },
  {
    name: "Preference cookies",
    purpose: "Remember your settings and preferences across sessions.",
    examples: "Language preferences, UI state.",
    canOptOut: true,
  },
]

const LAST_UPDATED = "March 28, 2026"

export default function CookiesPage() {
  return (
    <section className="bg-[#07070f] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/legal" className="transition-colors hover:text-slate-300">
            Legal
          </Link>
          <span>/</span>
          <span className="text-slate-400">Cookie policy</span>
        </nav>

        <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-3">
          <p className="text-sm font-semibold text-amber-300">Placeholder document</p>
          <p className="mt-0.5 text-sm text-amber-400/80">
            This is a structural placeholder. Replace with reviewed legal copy before launching.
          </p>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Cookie Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-6 text-sm text-slate-400">
          <p>
            We use cookies and similar technologies on our website and platform. This policy
            explains what cookies are, which ones we use, and how you can control them.
          </p>

          <div>
            <h2 className="text-base font-semibold text-white">What are cookies?</h2>
            <p className="mt-2 leading-relaxed">
              Cookies are small text files placed on your device by websites you visit. They are
              widely used to make websites work, improve performance, and provide analytics
              information to site owners.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">Cookies we use</h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.07]">
              {cookieTypes.map((type, i) => (
                <div
                  key={type.name}
                  className={`px-5 py-4 ${i !== cookieTypes.length - 1 ? "border-b border-white/[0.06]" : ""}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-white">{type.name}</p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        type.canOptOut
                          ? "border border-amber-500/20 bg-amber-500/10 text-amber-300"
                          : "border border-white/10 bg-white/[0.04] text-slate-400"
                      }`}
                    >
                      {type.canOptOut ? "Optional" : "Required"}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-400">{type.purpose}</p>
                  <p className="mt-1 text-xs text-slate-500">Examples: {type.examples}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">Managing cookies</h2>
            <p className="mt-2 leading-relaxed">
              You can control cookies through your browser settings. Note that disabling certain
              cookies may affect the functionality of our platform. For analytics cookies, you may
              also opt out directly through our cookie preference settings.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">Contact</h2>
            <p className="mt-2 leading-relaxed">
              For questions about our cookie use, contact privacy@collectivemind.com.
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-white/[0.06] pt-8">
          <Link href="/legal" className="text-sm text-blue-400 transition-colors hover:text-blue-300">
            ← Back to legal
          </Link>
        </div>
      </div>
    </section>
  )
}
