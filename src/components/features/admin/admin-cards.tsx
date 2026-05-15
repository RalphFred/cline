import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

export function MetricTile({
  label,
  value,
  icon: Icon,
  note,
}: {
  label: string
  value: string
  icon: LucideIcon
  note?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-4" />
      </div>
      <div className="mt-3 font-mono text-2xl font-semibold leading-none">
        {value}
      </div>
      {note ? <div className="mt-2 text-xs text-muted-foreground">{note}</div> : null}
    </div>
  )
}

export function EmptyPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-secondary/55 px-4 py-7 text-sm leading-6 text-muted-foreground">
      {children}
    </div>
  )
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="flex items-start justify-between gap-6 rounded-lg border border-border bg-card px-5 py-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-primary">{eyebrow}</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
