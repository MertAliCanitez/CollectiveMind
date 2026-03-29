"use client"

import { useState } from "react"
import { cn } from "@repo/ui"

const products = [
  { id: "insights", label: "Insights" },
  { id: "connect", label: "Connect" },
  { id: "workspace", label: "Workspace" },
]

interface FormState {
  name: string
  email: string
  company: string
  role: string
  message: string
  interests: string[]
}

type SubmitStatus = "idle" | "submitting" | "success" | "error"

export function ContactForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    company: "",
    role: "",
    message: "",
    interests: [],
  })
  const [status, setStatus] = useState<SubmitStatus>("idle")

  function update(field: keyof Omit<FormState, "interests">, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleInterest(id: string) {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("submitting")
    // TODO: wire to a real form submission endpoint
    await new Promise((r) => setTimeout(r, 800))
    setStatus("success")
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
          <svg
            className="h-6 w-6 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white">Message received</h3>
        <p className="mt-2 text-sm text-slate-400">
          We&apos;ll get back to you within 1 business day.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">
            Your name <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            placeholder="Alex Johnson"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
            Work email <span className="text-red-400">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="alex@company.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-slate-300">
            Company <span className="text-red-400">*</span>
          </label>
          <input
            id="company"
            type="text"
            required
            placeholder="Acme Corp"
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-300">
            Your role
          </label>
          <input
            id="role"
            type="text"
            placeholder="Head of Engineering"
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-slate-300">
          What are you interested in?
        </legend>
        <div className="flex flex-wrap gap-2">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggleInterest(p.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-150",
                form.interests.includes(p.id)
                  ? "border-blue-500/40 bg-blue-500/15 text-blue-300"
                  : "border-white/[0.1] text-slate-400 hover:border-white/20 hover:text-slate-300",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-slate-300">
          Message <span className="text-red-400">*</span>
        </label>
        <textarea
          id="message"
          required
          rows={4}
          placeholder="Tell us about your team and what you're trying to accomplish..."
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          className={cn(inputClass, "resize-y")}
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Sending..." : "Send message"}
      </button>

      <p className="text-xs text-slate-500">
        By submitting, you agree to our{" "}
        <a href="/legal/privacy" className="text-slate-400 underline hover:text-slate-300">
          privacy policy
        </a>
        . We&apos;ll only use your info to respond to your inquiry.
      </p>
    </form>
  )
}

const inputClass =
  "w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 backdrop-blur-sm transition-colors focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
