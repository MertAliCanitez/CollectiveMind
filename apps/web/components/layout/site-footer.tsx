import Link from "next/link"

const footerLinks = {
  Products: [
    { label: "Insights", href: "/products/insights" },
    { label: "Connect", href: "/products/connect" },
    { label: "Workspace", href: "/products/workspace" },
    { label: "All products", href: "/products" },
  ],
  Company: [
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
    { label: "Request a demo", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy policy", href: "/legal/privacy" },
    { label: "Terms of service", href: "/legal/terms" },
    { label: "Cookie policy", href: "/legal/cookies" },
  ],
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white">
                CM
              </span>
              CollectiveMind
            </Link>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              The operating stack for modern B2B teams. Analytics, integrations, and collaboration —
              unified.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {section}
              </h3>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} CollectiveMind. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">Built with care for B2B teams everywhere.</p>
        </div>
      </div>
    </footer>
  )
}
