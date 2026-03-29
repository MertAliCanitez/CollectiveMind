import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Legal",
  description:
    "Legal documents for CollectiveMind — privacy policy, terms of service, and cookie policy.",
}

const documents = [
  {
    title: "Privacy policy",
    description: "How we collect, use, and protect your personal information.",
    href: "/legal/privacy",
  },
  {
    title: "Terms of service",
    description: "The terms and conditions that govern your use of our platform.",
    href: "/legal/terms",
  },
  {
    title: "Cookie policy",
    description: "How we use cookies and similar tracking technologies.",
    href: "/legal/cookies",
  },
]

export default function LegalIndexPage() {
  return (
    <section className="bg-[#07070f] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Legal</h1>
        <p className="mt-4 text-slate-400">
          Important documents about how CollectiveMind operates and your rights as a user.
        </p>

        <div className="mt-10 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          {documents.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              className="flex items-center justify-between gap-6 px-6 py-5 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-white/[0.04]"
            >
              <div>
                <p className="text-sm font-semibold text-white">{doc.title}</p>
                <p className="mt-0.5 text-sm text-slate-400">{doc.description}</p>
              </div>
              <svg
                className="h-4 w-4 shrink-0 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
