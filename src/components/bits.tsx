import { cn } from "@/lib/utils"
import type { Lang, Mastery } from "@/lib/types"
import { hasHangul } from "@/lib/text"

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M10.2 8h8.6c.7 0 1.2.5 1.2 1.2V24l-5.5-2.9L9 24V9.2C9 8.5 9.5 8 10.2 8Z"
        fill="var(--background)"
      />
    </svg>
  )
}

export function Phrase({
  text,
  lang,
  className,
}: {
  text: string
  lang: Lang
  className?: string
}) {
  const hangul = hasHangul(text)
  return (
    <span
      lang={lang}
      className={cn(
        "break-words",
        hangul ? "font-sans font-medium tracking-tight" : "font-serif font-medium tracking-tight",
        className,
      )}
    >
      {text}
    </span>
  )
}

export function Ring({
  value,
  max,
  caption,
}: {
  value: number
  max: number
  caption: string
}) {
  const pct = max <= 0 ? 0 : Math.min(1, value / max)
  const radius = 36
  const circ = 2 * Math.PI * radius
  const dash = circ * pct
  return (
    <div className="relative size-[5.5rem] shrink-0" aria-hidden>
      <svg viewBox="0 0 88 88" className="size-full -rotate-90">
        <circle cx="44" cy="44" r={radius} className="fill-none stroke-foreground/10" strokeWidth="6" />
        <circle
          cx="44" cy="44" r={radius}
          className="fill-none stroke-primary transition-[stroke-dasharray] duration-500"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-medium tabular-nums leading-none">{value}</span>
        <span className="mt-1 text-[10px] tracking-wide text-muted-foreground">{caption}</span>
      </div>
    </div>
  )
}

export function MasteryDot({ mastery, className }: { mastery: Mastery; className?: string }) {
  return <span className={cn("size-2 shrink-0 rounded-full", `mastery-${mastery}`, className)} />
}

export function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border bg-background px-1 font-sans text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  )
}
