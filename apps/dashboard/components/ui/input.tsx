import { cn } from "@repo/ui"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
        "transition-colors placeholder:text-slate-400",
        "focus-visible:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-red-400 focus-visible:ring-red-400",
        className,
      )}
      {...props}
    />
  )
}
