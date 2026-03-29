import { cn } from "@repo/ui"

type ButtonVariant = "default" | "outline" | "ghost" | "secondary" | "link"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-[0_0_24px_rgba(99,102,241,0.35)] hover:opacity-90 hover:-translate-y-0.5 focus-visible:ring-violet-500",
  outline:
    "border border-white/15 bg-white/5 text-slate-300 backdrop-blur-sm hover:border-white/25 hover:bg-white/10 hover:text-white hover:-translate-y-0.5 focus-visible:ring-slate-400",
  ghost: "text-slate-400 hover:bg-white/5 hover:text-slate-100 focus-visible:ring-slate-500",
  secondary: "bg-white/10 text-slate-200 hover:bg-white/15 focus-visible:ring-slate-500",
  link: "text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline p-0 h-auto",
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-xl",
}

export function Button({
  variant = "default",
  size = "md",
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070f]",
        "disabled:pointer-events-none disabled:opacity-40",
        variantClasses[variant],
        variant !== "link" && sizeClasses[size],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
