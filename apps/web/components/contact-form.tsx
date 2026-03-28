"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@repo/ui"

const products = [
  { id: "insights", label: "Insights — analytics" },
  { id: "connect", label: "Connect — API platform" },
  { id: "workspace", label: "Workspace — collaboration" },
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("submitting")

    // TODO: wire to a real form submission endpoint (e.g. Resend, Formspark, server action)
    // For now, simulate a network delay and return success.
    await new Promise((r) => setTimeout(r, 800))
    setStatus("success")
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-6 w-6 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Message received</h3>
        <p className="mt-2 text-sm text-slate-500">
          We&apos;ll get back to you within 1 business day.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name + Email */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
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
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
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

      {/* Company + Role */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-slate-700">
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
          <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-700">
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

      {/* Product interest */}
      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-slate-700">
          What are you interested in?
        </legend>
        <div className="flex flex-wrap gap-2">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggleInterest(p.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                form.interests.includes(p.id)
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Message */}
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-slate-700">
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

      <Button
        type="submit"
        size="lg"
        disabled={status === "submitting"}
        className="w-full sm:w-auto"
      >
        {status === "submitting" ? "Sending..." : "Send message"}
      </Button>

      <p className="text-xs text-slate-400">
        By submitting, you agree to our{" "}
        <a href="/legal/privacy" className="underline hover:text-slate-600">
          privacy policy
        </a>
        . We&apos;ll only use your info to respond to your inquiry.
      </p>
    </form>
  )
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
