"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { cn } from "@repo/ui"
import { Home, Layers, CreditCard, Settings } from "../ui/icons"

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/products", label: "My Products", icon: Layers },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-56 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-slate-100 px-4">
        <Link href="/home" className="text-sm font-semibold text-slate-900 hover:text-indigo-600">
          CollectiveMind
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/home" && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <Icon size={16} className={cn(isActive ? "text-indigo-600" : "text-slate-400")} />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Org switcher + user */}
      <div className="space-y-2 border-t border-slate-100 p-3">
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
        <div className="flex items-center gap-2 px-1">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-7 w-7",
              },
            }}
          />
          <span className="text-xs text-slate-500">Account</span>
        </div>
      </div>
    </aside>
  )
}
