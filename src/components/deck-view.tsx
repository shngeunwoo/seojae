"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { Ellipsis, Pencil, Plus, Search, Star, Trash, Volume2 } from "lucide-react"
import { MasteryDot, Phrase } from "@/components/bits"
import { BulkDialog } from "@/components/bulk-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DeckDialog } from "@/components/deck-dialog"
import { posKey, WordDialog } from "@/components/word-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { deckBlurb, deckTitle, dueLabel } from "@/lib/labels"
import { studyPath } from "@/lib/routes"
import { isDue, masteryOf } from "@/lib/srs"
import { deleteCard, deleteDeck, downloadText, restoreCard, toggleFavorite, useAppState, addDrafts } from "@/lib/store"
import { csvCell, draftsFromCsv } from "@/lib/text"
import { speak } from "@/lib/speech"
import type { Card, Mastery } from "@/lib/types"
import { useI18n } from "@/lib/use-i18n"
import { cn } from "@/lib/utils"

type Filter = "all" | "today" | Mastery | "starred"
type SortKey = "recent" | "alpha" | "due" | "hard"

const filters: Filter[] = ["all", "today", "new", "learning", "review", "mastered", "starred"]

export function DeckView({ deckId }: { deckId: string }) {
  const state = useAppState()
  const { lang, t } = useI18n()
  const router = useRouter()
  const deck = state.decks.find((item) => item.id === deckId)
  const [query, setQuery] = useState("")
  const deferred = useDeferredValue(query)
  const [filter, setFilter] = useState<Filter>("all")
  const [sort, setSort] = useState<SortKey>("recent")
  const [wordOpen, setWordOpen] = useState(false)
  const [editing, setEditing] = useState<Card | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!deck) return
    document.title = `${deckTitle(deck, lang)} · ${t("brand")}`
  }, [deck, lang, t])

  useEffect(() => {
    const id = window.location.hash.replace("#", "")
    if (!id) return
    const node = document.getElementById(id)
    node?.scrollIntoView({ block: "center" })
  }, [deckId])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return
      }
      if (event.key === "/") {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (event.key.toLowerCase() === "n") {
        event.preventDefault()
        setEditing(null)
        setWordOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const cards = useMemo(
    () => state.cards.filter((card) => card.deckId === deckId),
    [state.cards, deckId],
  )

  const visible = useMemo(() => {
    const q = deferred.trim().toLowerCase()
    const list = cards.filter((card) => {
      if (filter === "today" && !isDue(card, state.clock)) return false
      if (filter === "starred" && !card.favorite) return false
      if (filter !== "all" && filter !== "today" && filter !== "starred" && masteryOf(card) !== filter) {
        return false
      }
      if (!q) return true
      return `${card.term} ${card.meaning} ${card.example} ${card.exampleMeaning} ${card.notes} ${card.tags.join(" ")}`
        .toLowerCase()
        .includes(q)
    })
    list.sort((a, b) => {
      if (sort === "alpha") return a.term.localeCompare(b.term, lang === "ko" ? "ko" : "en")
      if (sort === "due") return a.due - b.due
      if (sort === "hard") {
        const miss = (card: Card) => (card.reviews ? 1 - card.correct / card.reviews : 0)
        return miss(b) - miss(a) || b.lapses - a.lapses
      }
      return b.updatedAt - a.updatedAt
    })
    return list
  }, [cards, deferred, filter, sort, state.clock, lang])

  if (!deck) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-2xl font-medium">{t("missingDeck")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("missingDeckBody")}</p>
        <Button className="mt-6" nativeButton={false} render={<Link href="/" />}>{t("goHome")}</Button>
      </div>
    )
  }

  function exportCsv() {
    const header = ["term", "meaning", "example", "exampleMeaning", "pos", "tags", "notes"]
    const lines = [
      header.join(","),
      ...cards.map((card) =>
        [card.term, card.meaning, card.example, card.exampleMeaning, card.pos, card.tags.join("|"), card.notes]
          .map(csvCell)
          .join(","),
      ),
    ]
    downloadText(`${deck?.name || "deck"}.csv`, lines.join("\n"), "text/csv")
  }

  const filterLabel: Record<Filter, "filterAll" | "filterToday" | "filterNew" | "filterLearning" | "filterReview" | "filterMastered" | "filterStarred"> = {
    all: "filterAll",
    today: "filterToday",
    new: "filterNew",
    learning: "filterLearning",
    review: "filterReview",
    mastered: "filterMastered",
    starred: "filterStarred",
  }

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span data-color={deck.color} className="swatch size-2.5 rounded-full" />
            {t("wordCount", { n: cards.length })}
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">{deckTitle(deck, lang)}</h1>
          {deckBlurb(deck, lang) ? (
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{deckBlurb(deck, lang)}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="h-10" nativeButton={false} render={<Link href={studyPath(deck.id)} />}>{t("study")}</Button>
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => {
              setEditing(null)
              setWordOpen(true)
            }}
          >
            <Plus />
            {t("addWord")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button type="button" variant="outline" size="icon" className="size-10" aria-label={t("more")} />}>
              <Ellipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>{t("rename")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulkOpen(true)}>{t("bulkAdd")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileRef.current?.click()}>{t("importFile")}</DropdownMenuItem>
              <DropdownMenuItem onClick={exportCsv}>{t("exportCsv")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                {t("deleteDeck")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("search")}
            className="h-10 pl-9"
          />
        </label>
        <label className="text-sm text-muted-foreground">
          <span className="sr-only">{t("sortRecent")}</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="h-10 rounded-xl border bg-transparent px-3"
          >
            <option value="recent">{t("sortRecent")}</option>
            <option value="alpha">{t("sortAlpha")}</option>
            <option value="due">{t("sortDue")}</option>
            <option value="hard">{t("sortHard")}</option>
          </select>
        </label>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
            className={cn(
              "h-8 shrink-0 rounded-full border px-3 text-xs",
              filter === item ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t(filterLabel[item])}
          </button>
        ))}
      </div>

      {cards.length === 0 ? (
        <Empty title={t("emptyDeck")} body={t("emptyDeckBody")} action={t("addWord")} onClick={() => setWordOpen(true)} />
      ) : visible.length === 0 ? (
        <Empty title={t("emptyFilter")} body={t("emptyFilterBody")} />
      ) : (
        <ul className={cn("mt-4 divide-y overflow-hidden rounded-3xl border bg-card", deferred !== query && "opacity-70")}>
          {visible.map((card) => (
            <li key={card.id} id={`word-${card.id}`} className="cv-row">
              <article className="grid grid-cols-[auto_1fr_auto] items-start gap-3 px-3 py-3 sm:px-4">
                <MasteryDot mastery={masteryOf(card)} className="mt-2.5" />
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => {
                    setEditing(card)
                    setWordOpen(true)
                  }}
                >
                  <Phrase text={card.term} lang={card.termLang} className="text-lg" />
                  <span className="mt-0.5 block text-sm text-muted-foreground">{card.meaning}</span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                    <span>{t(posKey[card.pos])}</span>
                    <span>{dueLabel(card, lang, state.clock)}</span>
                    {card.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-foreground/5 px-1.5 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </span>
                </button>
                <div className="flex items-center">
                  <IconButton
                    label={card.favorite ? t("unstar") : t("starred")}
                    onClick={() => toggleFavorite(card.id)}
                  >
                    <Star className={cn("size-4", card.favorite && "fill-current text-primary")} />
                  </IconButton>
                  <IconButton
                    label={t("speak")}
                    onClick={() => {
                      if (state.settings.tts) void speak(card.term, state.settings.ttsRate)
                    }}
                  >
                    <Volume2 className="size-4" />
                  </IconButton>
                  <IconButton
                    label={t("edit")}
                    onClick={() => {
                      setEditing(card)
                      setWordOpen(true)
                    }}
                  >
                    <Pencil className="size-4" />
                  </IconButton>
                  <IconButton
                    label={t("delete")}
                    onClick={() => {
                      const removed = deleteCard(card.id)
                      if (!removed) return
                      toast(t("deletedWord"), {
                        action: {
                          label: t("undo"),
                          onClick: () => {
                            restoreCard(removed)
                            toast(t("restored"))
                          },
                        },
                      })
                    }}
                  >
                    <Trash className="size-4" />
                  </IconButton>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <WordDialog
        open={wordOpen}
        onOpenChange={setWordOpen}
        deckId={deck.id}
        card={editing}
      />
      <BulkDialog open={bulkOpen} onOpenChange={setBulkOpen} deckId={deck.id} />
      <DeckDialog open={renameOpen} onOpenChange={setRenameOpen} deck={deck} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteDeckTitle")}
        description={t("deleteDeckBody", { n: cards.length })}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        destructive
        onConfirm={() => {
          deleteDeck(deck.id)
          router.push("/")
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (!file) return
          const reader = new FileReader()
          reader.onload = () => {
            const drafts = draftsFromCsv(String(reader.result ?? ""))
            if (!drafts.length) {
              toast.error(t("importInvalid"))
              return
            }
            const result = addDrafts(deck.id, drafts)
            toast(t("bulkAdded", result))
          }
          reader.readAsText(file)
        }}
      />
    </div>
  )
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  )
}

function Empty({
  title,
  body,
  action,
  onClick,
}: {
  title: string
  body: string
  action?: string
  onClick?: () => void
}) {
  return (
    <div className="mt-8 rounded-3xl border border-dashed px-5 py-12 text-center">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{body}</p>
      {action && onClick ? (
        <Button type="button" className="mt-5" onClick={onClick}>
          {action}
        </Button>
      ) : null}
    </div>
  )
}
