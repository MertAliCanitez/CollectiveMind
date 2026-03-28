import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "CollectiveMind terms of service — the rules that govern your use of our platform.",
}

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of terms",
    content:
      "By accessing or using CollectiveMind services, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use our services.",
  },
  {
    id: "services",
    title: "2. Description of services",
    content:
      "CollectiveMind provides a suite of B2B SaaS products including analytics, API integration, and collaboration tools. Services are provided on a subscription basis as described in your selected plan.",
  },
  {
    id: "accounts",
    title: "3. Accounts and access",
    content:
      "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.",
  },
  {
    id: "acceptable-use",
    title: "4. Acceptable use",
    content:
      "You agree not to use our services for any unlawful purpose, to interfere with service operation, to attempt to gain unauthorized access, or to transmit harmful content.",
  },
  {
    id: "payment",
    title: "5. Payment and billing",
    content:
      "Subscription fees are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law. We reserve the right to change pricing with 30 days notice.",
  },
  {
    id: "ip",
    title: "6. Intellectual property",
    content:
      "CollectiveMind retains all rights to the platform and services. You retain all rights to data you submit. You grant us a license to use your data solely to provide the services.",
  },
  {
    id: "termination",
    title: "7. Termination",
    content:
      "Either party may terminate this agreement at any time. Upon termination, your access to the services will cease. We will retain your data for 30 days before deletion.",
  },
  {
    id: "limitation",
    title: "8. Limitation of liability",
    content:
      "To the maximum extent permitted by law, CollectiveMind shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the services.",
  },
  {
    id: "governing-law",
    title: "9. Governing law",
    content:
      "These terms shall be governed by the laws of the jurisdiction in which CollectiveMind is incorporated, without regard to conflict of law provisions.",
  },
  {
    id: "contact",
    title: "10. Contact",
    content: "For questions about these terms, contact us at legal@collectivemind.com.",
  },
]

const LAST_UPDATED = "March 28, 2026"

export default function TermsPage() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
          <Link href="/legal" className="hover:text-slate-600">
            Legal
          </Link>
          <span>/</span>
          <span className="text-slate-600">Terms of service</span>
        </nav>

        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <p className="text-sm font-semibold text-amber-800">Placeholder document</p>
          <p className="mt-0.5 text-sm text-amber-700">
            This is a structural placeholder. Replace with reviewed legal copy before launching.
          </p>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Terms of Service
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
