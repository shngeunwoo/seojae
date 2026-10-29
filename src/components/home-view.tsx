"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Phrase, Ring } from "@/components/bits"
import { DeckDialog } from "@/components/deck-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/format"
import { greetingKey } from "@/lib/i18n"
import { deckBlurb, deckTitle, libraryToday, streakCount, todayParts } from "@/lib/labels"
import { buildQueue } from "@/lib/study"
import { deckPath, studyPath } from "@/lib/routes"
import { setSession, useAppState } from "@/lib/store"
import type { Scope } from "@/lib/types"
import { useI18n } from "@/lib/use-i18n"
import { masteryOf } from "@/lib/srs"

export function HomeView() {
  const state = useAppState()
  const { lang, t } = useI18n()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const deferred = useDeferredValue(query)
  const [deckOpen, setDeckOpen] = useState(false)

  useEffect(() => {
    document.title = `${t("brand")} · Seojae`
  }, [t])

  const parts = useMemo(
    () => todayParts(state.cards, state.clock),
    [state.cards, state.clock],
  )
  const today = libraryToday(state)
  const streak = streakCount(state.logs, today)
  const studied = state.logs[today]?.reviews ?? 0
  const hour = state.clock ? new Date(state.clock).getHours() : 9

  const results = useMemo(() => {
    const q = deferred.trim().toLowerCase()
    if (!q) return []
    return state.cards
      .filter((card) =>
        `${card.term} ${card.meaning} ${card.example} ${card.tags.join(" ")}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 8)
  }, [deferred, state.cards])

  const recent = useMemo(
    () => state.cards.slice().sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4),
    [state.cards],
  )

  function start(scope: Scope) {
    const queue = buildQueue(state.cards, scope, 20, state.clock, false)
    if (!queue.length) return
    const now = Date.now()
    setSession({
      deckId: "all",
      mode: "flash",
      direction: "mix",
      scope,
      cardIds: queue.map((card) => card.id),
      index: 0,
      phase: "run",
      correct: 0,
      wrong: 0,
      missedIds: [],
      startedAt: now,
      lastTick: now,
      hints: 0,
      paused: false,
      activeSeconds: 0,
    })
    router.push(studyPath("all"))
  }

  const deckName = new Map(state.decks.map((deck) => [deck.id, deckTitle(deck, lang)]))

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
      <div className="grid content-start gap-8">
        <section className="shadow-lift rounded-[1.75rem] border bg-card px-5 py-6 sm:px-8 sm:py-8">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            {state.clock ? formatDate(state.clock, lang) : ""}
          </p>
          <h1 className="mt-3 max-w-xl text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl">
            <span className={lang === "en" ? "font-serif" : undefined}>{t(greetingKey(hour))}</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
            {parts.review > 0
              ? t("homeBody")
              : parts.fresh > 0
                ? t("homeFreshBody")
                : t("homeClearBody")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {parts.review > 0 ? (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                {t("homeReview", { n: parts.review })}
              </span>
            ) : null}
            {parts.fresh > 0 ? (
              <span className="rounded-full bg-foreground/5 px-3 py-1">
                {t("homeFresh", { n: parts.fresh })}
              </span>
            ) : null}
            {parts.today === 0 ? (
              <span className="rounded-full bg-foreground/5 px-3 py-1">{t("homeClear")}</span>
            ) : null}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {parts.today > 0 ? (
              <Button type="button" className="h-11 px-4" onClick={() => start(parts.review > 0 ? "today" : "new")}>
                {parts.review > 0 ? t("startToday") : t("startFresh")}
              </Button>
            ) : state.decks.length ? (
              <Button className="h-11 px-4" nativeButton={false} render={<Link href={deckPath(state.decks[0].id)} />}>
                {t("browse")}
              </Button>
            ) : (
              <Button type="button" className="h-11 px-4" onClick={() => setDeckOpen(true)}>
                {t("newDeck")}
              </Button>
            )}
            <Button variant="outline" className="h-11 px-4" nativeButton={false} render={<Link href="/stats" />}>
              {t("navStats")}
            </Button>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-lg font-medium">{t("deckIndex")}</h2>
            <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setDeckOpen(true)}>
              {t("newDeck")}
            </button>
          </div>
          {state.decks.length === 0 ? (
            <div className="rounded-3xl border border-dashed px-5 py-10 text-center">
              <p className="font-medium">{t("emptyDecks")}</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{t("emptyDecksBody")}</p>
              <Button type="button" className="mt-5 h-10" onClick={() => setDeckOpen(true)}>
                {t("newDeck")}
              </Button>
            </div>
          ) : (
            <ul className="grid gap-3">
              {state.decks.map((deck) => {
                const cards = state.cards.filter((card) => card.deckId === deck.id)
                const stats = todayParts(cards, state.clock)
                const mastered = cards.filter((card) => masteryOf(card) === "mastered").length
                const pct = cards.length ? Math.round((mastered / cards.length) * 100) : 0
                return (
                  <li key={deck.id}>
                    <Link
                      href={deckPath(deck.id)}
                      className="shadow-lift grid gap-4 rounded-3xl border bg-card px-4 py-4 transition hover:-translate-y-0.5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-5"
                    >
                      <span data-color={deck.color} className="swatch hidden size-11 rounded-2xl sm:block" />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span data-color={deck.color} className="swatch size-2.5 rounded-full sm:hidden" />
                          <span className="truncate text-base font-medium">{deckTitle(deck, lang)}</span>
                        </span>
                        <span className="mt-1 block truncate text-sm text-muted-foreground">
                          {deckBlurb(deck, lang) || t("wordCount", { n: cards.length })}
                        </span>
                        <span className="mt-3 block h-1 overflow-hidden rounded-full bg-foreground/10">
                          <span className="block h-full bg-primary" style={{ width: `${pct}%` }} />
                        </span>
                      </span>
                      <span className="flex gap-4 sm:block sm:text-right">
                        <span className="block font-serif text-3xl leading-none tabular-nums">{stats.today}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {t("todayShort", { n: stats.today })}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <aside className="grid content-start gap-4">
        <section className="shadow-lift flex items-center justify-between gap-4 rounded-3xl border bg-card px-5 py-5">
          <div>
            <p className="text-xs text-muted-foreground">{t("goal")}</p>
            <p className="mt-1 text-2xl font-medium tabular-nums">
              {t("goalOf", { n: studied, goal: state.settings.dailyGoal })}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("streak")} · {t("streakDays", { n: streak })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("mastered")} · {parts.mastered}
            </p>
          </div>
          <Ring value={studied} max={state.settings.dailyGoal} caption={t("goal")} />
        </section>

        <section className="rounded-3xl border bg-card p-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("librarySearch")}
              className="h-10 pl-9"
              aria-label={t("librarySearch")}
            />
          </label>
          {deferred.trim() ? (
            results.length ? (
              <ul className="mt-3 grid gap-1">
                {results.map((card) => (
                  <li key={card.id}>
                    <Link
                      href={deckPath(card.deckId, `word-${card.id}`)}
                      className="block rounded-xl px-2 py-2 hover:bg-muted"
                    >
                      <Phrase text={card.term} lang={card.termLang} className="text-base" />
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {card.meaning}
                        <span className="px-1.5">·</span>
                        {deckName.get(card.deckId)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 px-1 text-sm text-muted-foreground">{t("noMatches")}</p>
            )
          ) : (
            <div className="mt-4">
              <p className="px-1 text-xs font-medium tracking-wide text-muted-foreground">{t("recent")}</p>
              {recent.length === 0 ? (
                <p className="mt-2 px-1 text-sm text-muted-foreground">{t("noRecent")}</p>
              ) : (
                <ul className="mt-2 grid gap-1">
                  {recent.map((card) => (
                    <li key={card.id}>
                      <Link href={deckPath(card.deckId, `word-${card.id}`)} className="block rounded-xl px-2 py-2 hover:bg-muted">
                        <Phrase text={card.term} lang={card.termLang} />
                        <span className="block truncate text-sm text-muted-foreground">{card.meaning}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </aside>
      <DeckDialog open={deckOpen} onOpenChange={setDeckOpen} />
    </div>
  )
}
