import { cn } from "@repo/ui"

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "coming-soon"
  | "enterprise"
  | "popular"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-blue-500/15 text-blue-300 border border-blue-500/25",
  secondary: "bg-white/[0.08] text-slate-400 border border-white/10",
  outline: "border border-white/15 text-slate-400",
  success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  "coming-soon": "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  enterprise: "bg-violet-500/15 text-violet-300 border border-violet-500/25",
  popular:
    "bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-blue-300 border border-blue-500/25",
}

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
