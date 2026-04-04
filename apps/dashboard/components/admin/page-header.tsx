import Link from "next/link"
import { cn } from "@repo/ui"
import { ChevronRight } from "../ui/icons"

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  action?: React.ReactNode
}

export function PageHeader({ title, description, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1 text-xs text-zinc-500">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={12} className="text-zinc-600" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-zinc-300">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-zinc-300">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className={cn("flex items-start justify-between gap-4")}>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-zinc-400">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
