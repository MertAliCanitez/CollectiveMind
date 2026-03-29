"use client"

import Link from "next/link"
import { useState } from "react"
import { cn } from "@repo/ui"
import { Menu, X } from "@/components/ui/icons"

const navLinks = [
  { label: "Products", href: "/products" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
]

function NeuralLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="node-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#E879F9" />
        </linearGradient>
        <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* Connection lines */}
      <line x1="15" y1="7" x2="8" y2="14" stroke="url(#line-grad)" strokeWidth="1.2" />
      <line x1="15" y1="7" x2="22" y2="14" stroke="url(#line-grad)" strokeWidth="1.2" />
      <line x1="8" y1="14" x2="5" y2="22" stroke="url(#line-grad)" strokeWidth="1" />
      <line x1="22" y1="14" x2="25" y2="22" stroke="url(#line-grad)" strokeWidth="1" />
      <line x1="8" y1="14" x2="15" y2="20" stroke="url(#line-grad)" strokeWidth="1" />
      <line x1="22" y1="14" x2="15" y2="20" stroke="url(#line-grad)" strokeWidth="1" />
      {/* Trunk */}
      <line
        x1="15"
        y1="20"
        x2="15"
        y2="27"
        stroke="#6D28D9"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      {/* Nodes */}
      <circle cx="15" cy="7" r="3" fill="url(#node-grad)" />
      <circle cx="8" cy="14" r="2.2" fill="#60A5FA" />
      <circle cx="22" cy="14" r="2.2" fill="#8B5CF6" />
      <circle cx="5" cy="22" r="1.6" fill="#60A5FA" fillOpacity="0.7" />
      <circle cx="25" cy="22" r="1.6" fill="#E879F9" fillOpacity="0.7" />
      <circle cx="15" cy="20" r="1.6" fill="#8B5CF6" fillOpacity="0.8" />
    </svg>
  )
}

export function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.07] bg-[#07070f]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-white">
          <NeuralLogo />
          <span className="hidden sm:inline">
            Collective<span className="text-blue-400">Mind</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors duration-150 hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="https://dashboard.collectivemind.com/sign-in"
            className="text-sm font-medium text-slate-400 transition-colors duration-150 hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-1.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-200 hover:-translate-y-px hover:opacity-90"
          >
            Get started
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav */}
      <div
        className={cn(
          "border-t border-white/[0.07] bg-[#07070f]/95 backdrop-blur-xl md:hidden",
          mobileOpen ? "block" : "hidden",
        )}
      >
        <nav className="flex flex-col px-4 py-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.07] pt-3">
            <Link
              href="https://dashboard.collectivemind.com/sign-in"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/contact"
              className="inline-flex justify-center rounded-lg bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              onClick={() => setMobileOpen(false)}
            >
              Get started
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
