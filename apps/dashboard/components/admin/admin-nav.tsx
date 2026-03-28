"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@repo/ui"

const navSections = [
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products & Plans" },
    ],
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
    items: [
      { href: "/admin/audit", label: "Audit Log" },
    ],
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-52 flex-col border-r border-slate-200 bg-slate-900">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-slate-700/60 px-4">
        <div>
          <Link href="/admin" className="text-sm font-semibold text-white hover:text-indigo-300">
            CollectiveMind
          </Link>
          <p className="text-[10px] font-medium tracking-widest text-slate-400 uppercase">Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
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
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
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
      <div className="border-t border-slate-700/60 px-4 py-3">
        <Link href="/home" className="text-xs text-slate-500 hover:text-slate-300">
          ← Back to dashboard
        </Link>
      </div>
    </aside>
  )
}
