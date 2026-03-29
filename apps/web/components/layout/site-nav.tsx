"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@repo/ui"
import { Menu, X } from "@/components/ui/icons"

const navLinks = [
  { label: "Products", href: "/products" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
]

function BrandMark() {
  return (
    <Image
      src="/logo.png"
      alt="CollectiveMind logo"
      width={40}
      height={40}
      className="h-10 w-10 object-contain"
      style={{ mixBlendMode: "lighten" }}
      priority
    />
  )
}

export function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.07] bg-[#07070f]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 font-bold text-white">
          <BrandMark />
          <span className="hidden text-[0.95rem] tracking-tight sm:inline">
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
