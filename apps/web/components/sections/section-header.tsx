import { cn } from "@repo/ui"

interface SectionHeaderProps {
  eyebrow?: string
  heading: string
  subheading?: string
  align?: "left" | "center"
  className?: string
}

export function SectionHeader({
  eyebrow,
  heading,
  subheading,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {heading}
      </h2>
      {subheading && (
        <p className="mt-4 text-lg leading-relaxed text-slate-600">{subheading}</p>
      )}
    </div>
  )
}
