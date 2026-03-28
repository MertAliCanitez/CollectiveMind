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
  default: "bg-indigo-600 text-white",
  secondary: "bg-slate-100 text-slate-700",
  outline: "border border-slate-300 text-slate-600",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "coming-soon": "bg-amber-50 text-amber-700 border border-amber-200",
  enterprise: "bg-slate-900 text-white",
  popular: "bg-indigo-600 text-white",
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
