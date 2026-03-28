import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "CollectiveMind privacy policy — how we collect, use, and protect your data.",
}

// Placeholder content — replace with actual legal copy before launch.
// Sections follow the standard structure required by GDPR / CCPA.

const sections = [
  {
    id: "introduction",
    title: "1. Introduction",
    content:
      "CollectiveMind (\"we\", \"us\", \"our\") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.",
  },
  {
    id: "information-we-collect",
    title: "2. Information we collect",
    content:
      "We collect information you provide directly to us (such as your name, email address, and company), information collected automatically through cookies and similar technologies, and information from third-party services you connect to our platform.",
  },
  {
    id: "how-we-use",
    title: "3. How we use your information",
    content:
      "We use the information we collect to provide, maintain, and improve our services, process transactions, send communications, monitor usage patterns, and comply with legal obligations.",
  },
  {
    id: "information-sharing",
    title: "4. Information sharing and disclosure",
    content:
      "We do not sell your personal information. We may share your information with service providers who help us deliver our services, when required by law, or with your consent.",
  },
  {
    id: "data-retention",
    title: "5. Data retention",
    content:
      "We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, and resolve disputes.",
  },
  {
    id: "your-rights",
    title: "6. Your rights",
    content:
      "Depending on your location, you may have the right to access, correct, delete, or export your personal data. To exercise these rights, contact us at privacy@collectivemind.com.",
  },
  {
    id: "cookies",
    title: "7. Cookies",
    content:
      "We use cookies and similar tracking technologies. For more information, see our Cookie Policy.",
  },
  {
    id: "security",
    title: "8. Security",
    content:
      "We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction.",
  },
  {
    id: "contact",
    title: "9. Contact us",
    content:
      "For questions about this Privacy Policy, contact us at privacy@collectivemind.com or through our contact page.",
  },
]

const LAST_UPDATED = "March 28, 2026"

export default function PrivacyPage() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
          <Link href="/legal" className="hover:text-slate-600">Legal</Link>
          <span>/</span>
          <span className="text-slate-600">Privacy policy</span>
        </nav>

        {/* Placeholder notice */}
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <p className="text-sm font-semibold text-amber-800">Placeholder document</p>
          <p className="mt-0.5 text-sm text-amber-700">
            This is a structural placeholder. Replace with reviewed legal copy before launching
            publicly. Consider working with a lawyer who specializes in tech company privacy law.
          </p>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <div key={section.id} id={section.id}>
              <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{section.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-slate-100 pt-8">
          <Link href="/legal" className="text-sm text-indigo-600 hover:text-indigo-700">
            ← Back to legal
          </Link>
        </div>
      </div>
    </section>
  )
}
