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
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className="mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-xs font-semibold uppercase tracking-[0.18em] text-transparent">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
        {heading}
      </h2>
      {subheading && <p className="mt-5 text-lg leading-relaxed text-slate-400">{subheading}</p>}
    </div>
  )
}
