import type { Metadata } from "next"
import { ContactForm } from "@/components/contact-form"
import { Shield, Users, Zap } from "@/components/ui/icons"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the CollectiveMind team. Request a demo, ask about pricing, or just say hello.",
  openGraph: {
    title: "Contact — CollectiveMind",
    description: "Request a demo or get in touch with our team.",
  },
}

const trustPoints = [
  {
    icon: <Zap size={18} />,
    label: "Fast response",
    description: "We reply within 1 business day, usually faster.",
  },
  {
    icon: <Users size={18} />,
    label: "Talk to a human",
    description: "You'll hear from a real team member, not an automated sequence.",
  },
  {
    icon: <Shield size={18} />,
    label: "No sales pressure",
    description: "We'll help you figure out if CollectiveMind is the right fit. Honest.",
  },
]

export default function ContactPage() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          {/* Left — copy */}
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Get in touch
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Let&apos;s talk
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-500">
              Whether you want a product demo, have a question about pricing, or just want to
              understand if CollectiveMind is a good fit for your team — we&apos;re happy to help.
            </p>

            <div className="mt-10 space-y-6">
              {trustPoints.map((point) => (
                <div key={point.label} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    {point.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{point.label}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* During early access note */}
            <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-700">Early access period</p>
              <p className="mt-1 text-sm text-slate-500">
                CollectiveMind is currently in early access. All plans are available — reach out and
                we&apos;ll get you set up directly. No credit card required.
              </p>
            </div>
          </div>

          {/* Right — form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 text-xl font-bold text-slate-900">Send us a message</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  )
}
