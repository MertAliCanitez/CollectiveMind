"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@repo/ui"

const navSections = [
  {
    label: "Catalog",
    items: [{ href: "/admin/products", label: "Products & Plans" }],
  },
  {
    label: "Customers",
    items: [
      { href: "/admin/organizations", label: "Organizations" },
      { href: "/admin/grants", label: "Access Grants" },
    ],
  },
  {
    label: "Observability",
    items: [{ href: "/admin/audit", label: "Audit Log" }],
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-52 flex-col border-r border-zinc-800 bg-zinc-900">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-zinc-800 px-4">
        <div>
          <Link href="/admin" className="text-sm font-semibold text-zinc-100 hover:text-indigo-400">
            CollectiveMind
          </Link>
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ href, label }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/")
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 px-4 py-3">
        <Link href="/home" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Back to dashboard
        </Link>
      </div>
    </aside>
  )
}
