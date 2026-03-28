import { cn } from "@repo/ui"

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "secondary" | "outline"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  warning: "bg-amber-50 text-amber-700 border border-amber-100",
  destructive: "bg-red-50 text-red-700 border border-red-100",
  secondary: "bg-slate-100 text-slate-600 border border-slate-200",
  outline: "bg-white text-slate-600 border border-slate-300",
}

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
