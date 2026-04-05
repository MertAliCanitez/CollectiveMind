"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { OrganizationSwitcher, UserButton, useAuth } from "@clerk/nextjs"
import { cn } from "@repo/ui"
import { isOrgBillingManager } from "@repo/auth/roles"
import { Home, Layers, CreditCard, Settings } from "../ui/icons"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  billingOnly?: true
}

const navItems: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/products", label: "My Products", icon: Layers },
  { href: "/billing", label: "Billing", icon: CreditCard, billingOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
]

const clerkDarkAppearance = {
  variables: {
    colorBackground: "#18181b",
    colorText: "#f4f4f5",
    colorTextSecondary: "#a1a1aa",
    colorPrimary: "#6366f1",
    borderRadius: "0.5rem",
  },
  elements: {
    // Trigger button in the sidebar
    rootBox: "w-full",
    organizationSwitcherTrigger:
      "w-full rounded-lg px-2 py-1.5 text-sm hover:bg-zinc-800 justify-start text-zinc-300",
    // Popup card
    organizationSwitcherPopoverCard:
      "bg-zinc-900 border border-zinc-700 shadow-xl shadow-black/40",
    organizationSwitcherPopoverActions: "bg-zinc-900",
    organizationPreviewMainIdentifier: "text-zinc-100 font-medium",
    organizationPreviewSecondaryIdentifier: "text-zinc-400",
    organizationSwitcherPopoverActionButton:
      "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 rounded-lg",
    organizationSwitcherPopoverActionButtonText: "text-zinc-300",
    organizationSwitcherPopoverActionButtonIcon: "text-zinc-500",
    organizationSwitcherPopoverFooter: "border-t border-zinc-800 bg-zinc-900",
    notificationBadge: "bg-indigo-600",
  },
}

const userButtonDarkAppearance = {
  variables: {
    colorBackground: "#18181b",
    colorText: "#f4f4f5",
    colorTextSecondary: "#a1a1aa",
    colorPrimary: "#6366f1",
    borderRadius: "0.5rem",
  },
  elements: {
    avatarBox: "h-7 w-7",
    // Popup card
    userButtonPopoverCard:
      "bg-zinc-900 border border-zinc-700 shadow-xl shadow-black/40",
    userButtonPopoverActions: "bg-zinc-900",
    userButtonPopoverActionButton:
      "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 rounded-lg",
    userButtonPopoverActionButtonText: "text-zinc-300",
    userButtonPopoverActionButtonIcon: "text-zinc-500",
    userButtonPopoverFooter: "border-t border-zinc-800 bg-zinc-900",
    userPreviewMainIdentifier: "text-zinc-100 font-medium",
    userPreviewSecondaryIdentifier: "text-zinc-400",
  },
}

export function DashboardNav() {
  const pathname = usePathname()
  const { orgRole } = useAuth()
  const canSeeBilling = isOrgBillingManager(orgRole)
  const visibleNavItems = navItems.filter((item) => !item.billingOnly || canSeeBilling)

  return (
    <aside className="flex h-full w-56 flex-col border-r border-zinc-800 bg-zinc-900">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-zinc-800 px-4">
        <Link href="/home" className="text-sm font-semibold text-zinc-100 hover:text-indigo-400">
          CollectiveMind
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {visibleNavItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/home" && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
                  )}
                >
                  <Icon size={16} className={cn(isActive ? "text-white" : "text-zinc-500")} />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Org switcher + user */}
      <div className="space-y-2 border-t border-zinc-800 p-3">
        <OrganizationSwitcher hidePersonal appearance={clerkDarkAppearance} />
        <div className="flex items-center gap-2 px-1">
          <UserButton appearance={userButtonDarkAppearance} />
          <span className="text-xs text-zinc-500">Account</span>
        </div>
      </div>
    </aside>
  )
}
