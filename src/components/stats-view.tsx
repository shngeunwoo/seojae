"use client"

import Link from "next/link"
import { useEffect } from "react"
import { Phrase } from "@/components/bits"
import { formatMinutes, percent } from "@/lib/format"
import {
  deckTitle,
  hardestCards,
  heatmap,
  libraryToday,
  recentStats,
  streakCount,
  todayParts,
} from "@/lib/labels"
import { masteryOf } from "@/lib/srs"
import { useAppState } from "@/lib/store"
import type { Mastery } from "@/lib/types"
import { deckPath } from "@/lib/routes"
import { useI18n } from "@/lib/use-i18n"
import { cn } from "@/lib/utils"

const order: Mastery[] = ["new", "learning", "review", "mastered"]

export function StatsView() {
  const state = useAppState()
  const { lang, t } = useI18n()
  const today = libraryToday(state)
  const streak = streakCount(state.logs, today)
  const week = recentStats(state.logs, today, 7)
  const todayLog = state.logs[today]
  const parts = todayParts(state.cards, state.clock)
  const days = heatmap(today)
  const studiedDays = days.some((day) => (state.logs[day.key]?.reviews ?? 0) > 0)
  const hard = hardestCards(state.cards)
  const weekdays = t("weekdays").split(",")
  const deckName = new Map(state.decks.map((deck) => [deck.id, deck]))

  useEffect(() => {
    document.title = `${t("statsTitle")} · ${t("brand")}`
  }, [t])

  const masteryCounts = order.map((key) => ({
    key,
    count: state.cards.filter((card) => masteryOf(card) === key).length,
  }))
  const total = state.cards.length || 1

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">{t("statsTitle")}</h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{t("statsBody")}</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label={t("streak")} value={t("streakDays", { n: streak })} />
        <Tile label={t("todayReviews")} value={t("wordCount", { n: todayLog?.reviews ?? 0 })} />
        <Tile label={t("last7")} value={week.reviews ? percent(week.rate) : "\u2014"} hint={t("accuracyLabel")} />
        <Tile label={t("minutesLabel")} value={formatMinutes((todayLog?.seconds ?? 0), lang)} />
      </section>
      <section className="rounded-3xl border bg-card p-4 sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-sm font-medium">{t("heatmap")}</h2>
          <p className="text-xs text-muted-foreground">
            {t("less")}
            <span className="mx-2 inline-flex gap-1 align-middle">
              {[0, 1, 2, 3, 4].map((level) => (
                <span key={level} className={cn("inline-block size-2.5 rounded-[3px]", heatClass(level === 0 ? 0 : level * 8))} />
              ))}
            </span>
            {t("heatMore")}
          </p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <div className="flex gap-2">
            <div className="grid grid-rows-7 gap-1 pt-0 text-[10px] text-muted-foreground">
              {weekdays.map((day, index) => (
                <span key={`${day}-${index}`} className="flex h-3.5 items-center">{index % 2 === 0 ? day : ""}</span>
              ))}
            </div>
            <div className="grid grid-flow-col grid-rows-7 gap-1">
              {days.map((day) => {
                const reviews = state.logs[day.key]?.reviews ?? 0
                return (
                  <span
                    key={day.key}
                    title={`${day.key} · ${reviews}`}
                    className={cn(
                      "size-3.5 rounded-[3px]",
                      day.future ? "bg-transparent" : heatClass(reviews),
                    )}
                  />
                )
              })}
            </div>
          </div>
        </div>
        {studiedDays ? null : <p className="mt-4 text-sm text-muted-foreground">{t("heatmapEmpty")}</p>}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border bg-card p-5">
          <h2 className="text-sm font-medium">{t("mastered")}</h2>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-foreground/10">
            {masteryCounts.map((item) => (
              <span
                key={item.key}
                className={cn("h-full", `mastery-${item.key}`)}
                style={{ width: `${(item.count / total) * 100}%` }}
              />
            ))}
          </div>
          <ul className="mt-4 grid gap-2 text-sm">
            {masteryCounts.map((item) => (
              <li key={item.key} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", `mastery-${item.key}`)} />
                  {t(item.key === "new" ? "masteryNew" : item.key === "learning" ? "masteryLearning" : item.key === "review" ? "masteryReview" : "masteryMastered")}
                </span>
                <span className="tabular-nums text-muted-foreground">{item.count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            {t("totalWords")} · {state.cards.length} · {t("todayShort", { n: parts.today })}
          </p>
        </div>
        <div className="rounded-3xl border bg-card p-5">
          <h2 className="text-sm font-medium">{t("byDeck")}</h2>
          <ul className="mt-3 grid gap-3">
            {state.decks.length === 0 ? (
              <li className="text-sm text-muted-foreground">{t("emptyDecks")}</li>
            ) : (
              state.decks.map((deck) => {
                const deckCards = state.cards.filter((card) => card.deckId === deck.id)
                const mastered = deckCards.filter((card) => masteryOf(card) === "mastered").length
                const pct = deckCards.length ? Math.round((mastered / deckCards.length) * 100) : 0
                return (
                  <li key={deck.id}>
                    <Link href={deckPath(deck.id)} className="block rounded-xl hover:bg-muted/60">
                      <span className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <span data-color={deck.color} className="swatch size-2.5 rounded-full" />
                          <span className="truncate">{deckTitle(deck, lang)}</span>
                        </span>
                        <span className="tabular-nums text-muted-foreground">{pct}%</span>
                      </span>
                      <span className="mt-2 block h-1 overflow-hidden rounded-full bg-foreground/10">
                        <span className="block h-full bg-primary" style={{ width: `${pct}%` }} />
                      </span>
                    </Link>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      </section>
      <section>
        <h2 className="text-sm font-medium">{t("hardest")}</h2>
        {hard.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("noHardest")}</p>
        ) : (
          <ul className="mt-3 divide-y overflow-hidden rounded-3xl border bg-card">
            {hard.map((card) => (
              <li key={card.id}>
                <Link href={deckPath(card.deckId, `word-${card.id}`)} className="flex items-baseline justify-between gap-4 px-4 py-3 hover:bg-muted/50">
                  <span>
                    <Phrase text={card.term} lang={card.termLang} className="text-lg" />
                    <span className="mt-0.5 block text-sm text-muted-foreground">{card.meaning}</span>
                  </span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {percent(card.reviews ? card.correct / card.reviews : 0)}
                    <span className="block text-right text-[11px]">{deckName.get(card.deckId) ? deckTitle(deckName.get(card.deckId)!, lang) : ""}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-3xl border bg-card px-4 py-4">
      <p className="text-xs text-muted-foreground">{hint || label}</p>
      <p className="mt-2 text-2xl font-medium tracking-tight tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{label}</p> : null}
    </div>
  )
}

function heatClass(reviews: number) {
  if (reviews <= 0) return "bg-foreground/10"
  if (reviews < 5) return "bg-primary/25"
  if (reviews < 15) return "bg-primary/45"
  if (reviews < 30) return "bg-primary/70"
  return "bg-primary"
}
