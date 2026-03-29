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

function FooterLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="footer-node-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#E879F9" />
        </linearGradient>
        <linearGradient id="footer-line-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <line x1="15" y1="7" x2="8" y2="14" stroke="url(#footer-line-grad)" strokeWidth="1.2" />
      <line x1="15" y1="7" x2="22" y2="14" stroke="url(#footer-line-grad)" strokeWidth="1.2" />
      <line x1="8" y1="14" x2="5" y2="22" stroke="url(#footer-line-grad)" strokeWidth="1" />
      <line x1="22" y1="14" x2="25" y2="22" stroke="url(#footer-line-grad)" strokeWidth="1" />
      <line x1="8" y1="14" x2="15" y2="20" stroke="url(#footer-line-grad)" strokeWidth="1" />
      <line x1="22" y1="14" x2="15" y2="20" stroke="url(#footer-line-grad)" strokeWidth="1" />
      <line
        x1="15"
        y1="20"
        x2="15"
        y2="27"
        stroke="#6D28D9"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <circle cx="15" cy="7" r="3" fill="url(#footer-node-grad)" />
      <circle cx="8" cy="14" r="2.2" fill="#60A5FA" />
      <circle cx="22" cy="14" r="2.2" fill="#8B5CF6" />
      <circle cx="5" cy="22" r="1.6" fill="#60A5FA" fillOpacity="0.6" />
      <circle cx="25" cy="22" r="1.6" fill="#E879F9" fillOpacity="0.6" />
      <circle cx="15" cy="20" r="1.6" fill="#8B5CF6" fillOpacity="0.7" />
    </svg>
  )
}

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/[0.07] bg-[#07070f]">
      {/* Top gradient separator glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-white">
              <FooterLogo />
              <span>
                Collective<span className="text-blue-400">Mind</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              The operating stack for modern B2B teams. Analytics, integrations, and collaboration —
              unified.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                {section}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 transition-colors duration-150 hover:text-slate-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-600">
            &copy; {new Date().getFullYear()} CollectiveMind. All rights reserved.
          </p>
          <p className="text-xs text-slate-700">Built for teams who think collectively.</p>
        </div>
      </div>
    </footer>
  )
}
