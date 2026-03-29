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
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: <Users size={18} />,
    label: "Talk to a human",
    description: "You'll hear from a real team member, not an automated sequence.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: <Shield size={18} />,
    label: "No sales pressure",
    description: "We'll help you figure out if CollectiveMind is the right fit. Honest.",
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
  },
]

export default function ContactPage() {
  return (
    <section className="relative bg-[#07070f] py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]"
          style={{ animation: "glow-pulse 11s ease-in-out infinite" }}
        />
        <div
          className="absolute -right-32 bottom-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[110px]"
          style={{ animation: "glow-pulse 13s ease-in-out infinite 2s" }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          {/* Left — copy */}
          <div>
            <p className="mb-3 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-sm font-semibold uppercase tracking-widest text-transparent">
              Get in touch
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Let&apos;s talk
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-400">
              Whether you want a product demo, have a question about pricing, or just want to
              understand if CollectiveMind is a good fit for your team — we&apos;re happy to help.
            </p>

            <div className="mt-10 space-y-6">
              {trustPoints.map((point) => (
                <div key={point.label} className="flex items-start gap-4">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${point.bg} ${point.color}`}
                  >
                    {point.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{point.label}</p>
                    <p className="mt-0.5 text-sm text-slate-400">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">Early access period</p>
              <p className="mt-1 text-sm text-slate-400">
                CollectiveMind is currently in early access. All plans are available — reach out and
                we&apos;ll get you set up directly. No credit card required.
              </p>
            </div>
          </div>

          {/* Right — form */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-sm sm:p-8">
            <h2 className="mb-6 text-xl font-bold text-white">Send us a message</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  )
}
