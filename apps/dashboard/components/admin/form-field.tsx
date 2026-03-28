import { cn } from "@repo/ui"

interface FormFieldProps {
  label: string
  htmlFor?: string
  description?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  htmlFor,
  description,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {description && !error && <p className="text-xs text-slate-500">{description}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
