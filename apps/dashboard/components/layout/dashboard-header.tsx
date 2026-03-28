"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { cn } from "@repo/ui"
import { Menu, X, Home, Layers, CreditCard, Settings } from "../ui/icons"

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/products", label: "My Products", icon: Layers },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function DashboardHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link href="/home" className="text-sm font-semibold text-slate-900">
          CollectiveMind
        </Link>
        <div className="flex items-center gap-3">
          <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <nav className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
              <span className="text-sm font-semibold text-slate-900">CollectiveMind</span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-2 py-3">
              <ul className="space-y-0.5">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const isActive =
                    pathname === href || (href !== "/home" && pathname.startsWith(href))
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                        )}
                      >
                        <Icon
                          size={16}
                          className={cn(isActive ? "text-indigo-600" : "text-slate-400")}
                        />
                        {label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="border-t border-slate-100 p-3">
              <OrganizationSwitcher
                hidePersonal
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    organizationSwitcherTrigger:
                      "w-full rounded-lg px-2 py-1.5 text-sm hover:bg-slate-100 justify-start",
                  },
                }}
              />
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
