import Image from "next/image"
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

function FooterBrand() {
  return (
    <Image
      src="/logo.png"
      alt="CollectiveMind logo"
      width={48}
      height={48}
      className="h-12 w-12 object-contain"
      style={{ mixBlendMode: "lighten" }}
    />
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
            <Link href="/" className="flex items-center gap-1.5 font-bold text-white">
              <FooterBrand />
              <span className="text-[0.95rem] tracking-tight">
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
