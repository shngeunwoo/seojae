"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { ChartColumn, House, Keyboard, Library, Plus, Settings } from "lucide-react"
import { Mark } from "@/components/bits"
import { DeckDialog } from "@/components/deck-dialog"
import { SettingsDialog } from "@/components/settings-dialog"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Kbd } from "@/components/bits"
import { deckTitle, todayParts } from "@/lib/labels"
import { deckPath } from "@/lib/routes"
import { useAppState } from "@/lib/store"
import { useI18n } from "@/lib/use-i18n"
import { cn } from "@/lib/utils"

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const state = useAppState()
  const { lang, t } = useI18n()
  const [deckOpen, setDeckOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const focus = pathname.startsWith("/study")

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return
      }
      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault()
        setHelpOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  if (focus) return <div className="min-h-dvh">{children}</div>

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {t("skip")}
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background/80 px-3 py-4 backdrop-blur md:flex">
        <Link href="/" className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <Mark className="size-8 text-primary" />
          <span>
            <span className="block text-sm font-semibold tracking-tight">{t("brand")}</span>
            <span className="block text-[11px] text-muted-foreground">Seojae</span>
          </span>
        </Link>
        <nav className="mt-6 grid gap-1" aria-label="primary">
          <NavLink href="/" active={pathname === "/"} icon={<House className="size-4" />}>
            {t("navToday")}
          </NavLink>
          <NavLink href="/stats" active={pathname.startsWith("/stats")} icon={<ChartColumn className="size-4" />}>
            {t("navStats")}
          </NavLink>
        </nav>
        <div className="mt-6 flex items-center justify-between px-2">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground">{t("deckIndex")}</p>
          <Button type="button" size="icon-sm" variant="ghost" onClick={() => setDeckOpen(true)} aria-label={t("newDeck")}>
            <Plus />
          </Button>
        </div>
        <div className="mt-1 grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto">
          {state.decks.map((deck) => {
            const count = todayParts(
              state.cards.filter((card) => card.deckId === deck.id),
              state.clock,
            ).today
            const active = pathname === "/deck" && searchParams.get("id") === deck.id
            return (
              <Link
                key={deck.id}
                href={deckPath(deck.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-2 py-2 text-sm",
                  active ? "bg-foreground/5 font-medium" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                )}
              >
                <span data-color={deck.color} className="swatch size-2.5 rounded-full" />
                <span className="min-w-0 flex-1 truncate">{deckTitle(deck, lang)}</span>
                {count > 0 ? <span className="tabular-nums text-xs">{count}</span> : null}
              </Link>
            )
          })}
        </div>
        <div className="mt-3 grid gap-1 border-t pt-3">
          <button type="button" className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted-foreground hover:bg-foreground/5 hover:text-foreground" onClick={() => setHelpOpen(true)}>
            <Keyboard className="size-4" />
            {t("shortcutTitle")}
          </button>
          <button type="button" className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted-foreground hover:bg-foreground/5 hover:text-foreground" onClick={() => setSettingsOpen(true)}>
            <Settings className="size-4" />
            {t("navSettings")}
          </button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Mark className="size-7 text-primary" />
            {t("brand")}
          </Link>
          <Button type="button" size="icon" variant="ghost" aria-label={t("navSettings")} onClick={() => setSettingsOpen(true)}>
            <Settings />
          </Button>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 md:px-8 md:py-10 md:pb-10">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid grid-cols-4">
          <Tab href="/" active={pathname === "/"} label={t("navToday")} icon={<House className="size-4" />} />
          <button type="button" className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground" onClick={() => setSheetOpen(true)}>
            <Library className="size-4" />
            {t("navDecks")}
          </button>
          <Tab href="/stats" active={pathname.startsWith("/stats")} label={t("navStats")} icon={<ChartColumn className="size-4" />} />
          <button type="button" className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground" onClick={() => setSettingsOpen(true)}>
            <Settings className="size-4" />
            {t("navSettings")}
          </button>
        </div>
      </nav>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>{t("deckIndex")}</SheetTitle>
            <SheetDescription>{t("wordCount", { n: state.cards.length })}</SheetDescription>
          </SheetHeader>
          <div className="grid gap-1 overflow-y-auto px-3 pb-6">
            {state.decks.map((deck) => (
              <Link
                key={deck.id}
                href={deckPath(deck.id)}
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-muted"
              >
                <span data-color={deck.color} className="swatch size-3 rounded-full" />
                <span className="min-w-0 flex-1 truncate text-sm">{deckTitle(deck, lang)}</span>
              </Link>
            ))}
            <Button type="button" variant="outline" className="mt-2" onClick={() => { setSheetOpen(false); setDeckOpen(true) }}>
              <Plus />
              {t("newDeck")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <DeckDialog open={deckOpen} onOpenChange={setDeckOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ShortcutDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  )
}

function NavLink({
  href,
  active,
  icon,
  children,
}: {
  href: string
  active: boolean
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm",
        active ? "bg-foreground/5 font-medium" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </Link>
  )
}

function Tab({
  href,
  active,
  label,
  icon,
}: {
  href: string
  active: boolean
  label: string
  icon: ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center gap-1 py-2.5 text-[11px]",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {icon}
      {label}
    </Link>
  )
}

function ShortcutDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  const rows = [
    ["Space", t("shortcutFlip")],
    ["1  2  3  4", t("shortcutGrade")],
    ["S", t("shortcutSpeak")],
    ["F", t("shortcutStar")],
    ["Esc", t("shortcutExit")],
    ["/", t("shortcutSearch")],
    ["N", t("shortcutNew")],
    ["?", t("shortcutHelp")],
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("shortcutTitle")}</DialogTitle>
          <DialogDescription>{t("reflects")}</DialogDescription>
        </DialogHeader>
        <ul className="grid gap-2">
          {rows.map(([keys, label]) => (
            <li key={label} className="flex items-center justify-between gap-3 text-sm">
              <span>{label}</span>
              <span className="flex gap-1">
                {keys.split(/\s+/).filter(Boolean).map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
