"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FlashMode, ListenMode, MatchMode, QuizMode, StudyBar, TypeMode } from "@/components/study/modes"
import { formatMinutes, percent } from "@/lib/format"
import { deckTitle } from "@/lib/labels"
import { buildQueue, scopeCount } from "@/lib/study"
import {
  clearSession,
  flushStudyTime,
  markSummary,
  reviewInSession,
  reviewMany,
  setSession,
  useAppState,
} from "@/lib/store"
import type { Direction, Scope, Session, StudyMode } from "@/lib/types"
import { DIRECTIONS, SCOPES, STUDY_MODES } from "@/lib/types"
import { useI18n } from "@/lib/use-i18n"
import type { DictKey } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const modeKey: Record<StudyMode, DictKey> = {
  flash: "modeFlash",
  quiz: "modeQuiz",
  type: "modeType",
  listen: "modeListen",
  match: "modeMatch",
}
const modeBody: Record<StudyMode, DictKey> = {
  flash: "modeFlashBody",
  quiz: "modeQuizBody",
  type: "modeTypeBody",
  listen: "modeListenBody",
  match: "modeMatchBody",
}
const scopeKey: Record<Scope, DictKey> = {
  today: "scopeToday",
  new: "scopeNew",
  weak: "scopeWeak",
  starred: "scopeStarred",
  all: "scopeAll",
}
const directionKey: Record<Direction, DictKey> = {
  forward: "dirForward",
  reverse: "dirReverse",
  mix: "dirMix",
}

export function StudyView({ deckId }: { deckId: string }) {
  const state = useAppState()
  const { lang, t } = useI18n()
  const deck = deckId === "all" ? null : state.decks.find((item) => item.id === deckId)
  const cards = useMemo(
    () => (deckId === "all" ? state.cards : state.cards.filter((card) => card.deckId === deckId)),
    [state.cards, deckId],
  )
  const session = state.session?.deckId === deckId ? state.session : null
  const title = deck ? deckTitle(deck, lang) : t("allDecks")

  useEffect(() => {
    document.title = `${title} \u00b7 ${t("studyKicker")}`
  }, [title, t])

  if (deckId !== "all" && !deck) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-medium">{t("missingDeck")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("missingDeckBody")}</p>
        <Button className="mt-6" nativeButton={false} render={<Link href="/" />}>{t("goHome")}</Button>
      </div>
    )
  }

  if (session?.phase === "summary") {
    return <Summary session={session} cards={cards} title={title} deckId={deckId} />
  }
  if (session && session.phase === "run" && !session.paused) {
    return <Runner session={session} cards={state.cards} title={title} deckId={deckId} />
  }
  return (
    <Setup
      deckId={deckId}
      title={title}
      cards={cards}
      session={session}
      foreign={Boolean(state.session && state.session.deckId !== deckId && state.session.phase === "run")}
      clock={state.clock}
    />
  )
}

function Setup({
  deckId,
  title,
  cards,
  session,
  foreign,
  clock,
}: {
  deckId: string
  title: string
  cards: ReturnType<typeof useAppState>["cards"]
  session: Session | null
  foreign: boolean
  clock: number
}) {
  const { t } = useI18n()
  const [mode, setMode] = useState<StudyMode>("flash")
  const [direction, setDirection] = useState<Direction>("mix")
  const [scope, setScope] = useState<Scope>(() => (scopeCount(cards, "today", clock) > 0 ? "today" : "all"))
  const [limit, setLimit] = useState(20)
  const available = scopeCount(cards, scope, clock)
  const count = limit === 0 ? available : Math.min(limit, available)

  function begin(cardIds: string[], nextMode: StudyMode, nextDirection: Direction, nextScope: Scope) {
    const now = Date.now()
    setSession({
      deckId,
      mode: nextMode,
      direction: nextDirection,
      scope: nextScope,
      cardIds,
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
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground">{t("studyKicker")}</p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("reflects")}</p>
      </div>
      {session?.phase === "run" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
          <p className="text-sm">{t("resumeBody", { done: session.index, total: session.cardIds.length })}</p>
          <Button
            type="button"
            onClick={() => setSession({ ...session, paused: false, lastTick: Date.now() })}
          >
            {t("resume")}
          </Button>
        </div>
      ) : null}
      {foreign ? <p className="text-sm text-muted-foreground">{t("otherSession")}</p> : null}
      <div className="grid gap-2 sm:grid-cols-5">
        {STUDY_MODES.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={mode === item}
            onClick={() => setMode(item)}
            className={cn(
              "rounded-2xl border px-3 py-3 text-left",
              mode === item ? "border-primary bg-primary/10" : "bg-card hover:border-foreground/20",
            )}
          >
            <span className="block text-sm font-medium">{t(modeKey[item])}</span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">{t(modeBody[item])}</span>
          </button>
        ))}
      </div>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">{t("direction")}</legend>
        <div className="flex flex-wrap gap-2">
          {DIRECTIONS.map((item) => (
            <Chip key={item} pressed={direction === item} onClick={() => setDirection(item)}>
              {t(directionKey[item])}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">{t("scope")}</legend>
        <div className="flex flex-wrap gap-2">
          {SCOPES.map((item) => (
            <Chip key={item} pressed={scope === item} onClick={() => setScope(item)}>
              {t(scopeKey[item])} \u00b7 {scopeCount(cards, item, clock)}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">{t("count")}</legend>
        <div className="flex flex-wrap gap-2">
          {[10, 20, 40, 0].map((item) => (
            <Chip key={item} pressed={limit === item} onClick={() => setLimit(item)}>
              {item === 0 ? t("countAll") : item}
            </Chip>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("available", { n: count })}</p>
      </fieldset>
      {available === 0 ? (
        <div className="rounded-3xl border border-dashed px-5 py-8 text-center">
          <p className="font-medium">{t("nothingTitle")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("nothingBody")}</p>
        </div>
      ) : (
        <Button
          type="button"
          className="h-11"
          onClick={() => {
            const queue = buildQueue(cards, scope, limit, clock, mode !== "flash")
            const ids = (mode === "match" ? queue.slice(0, 6) : queue).map((card) => card.id)
            if (mode === "match" && ids.length < 3) return
            begin(ids, mode, direction, scope)
          }}
        >
          {t("start")}
        </Button>
      )}
      {mode === "match" && available > 0 && available < 3 ? (
        <p className="text-sm text-muted-foreground">{t("matchNeed")}</p>
      ) : null}
    </div>
  )
}

function Runner({
  session,
  cards,
  title,
  deckId,
}: {
  session: Session
  cards: ReturnType<typeof useAppState>["cards"]
  title: string
  deckId: string
}) {
  const state = useAppState()
  const { t } = useI18n()
  const router = useRouter()
  const queue = useMemo(() => {
    const map = new Map(cards.map((card) => [card.id, card]))
    return session.cardIds.map((id) => map.get(id)).filter((card): card is NonNullable<typeof card> => Boolean(card))
  }, [cards, session.cardIds])
  const current = queue[session.index]

  useEffect(() => {
    if (!current) markSummary()
  }, [current])

  function exit() {
    const live = flushStudyTime() ?? session
    setSession({ ...live, paused: true, lastTick: Date.now() })
    toast(t("progressSaved"))
    router.push(deckId === "all" ? "/" : `/deck/${deckId}`)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-4 sm:px-6">
      <StudyBar
        title={`${title} \u00b7 ${t(modeKey[session.mode])}`}
        index={session.index}
        total={queue.length}
        onExit={exit}
        exitLabel={t("exit")}
      />
      <div className="flex flex-1 flex-col justify-center py-6">
        {current && session.mode === "flash" ? (
          <FlashMode
            key={current.id}
            card={current}
            index={session.index}
            direction={session.direction}
            showExample={state.settings.showExample}
            rate={state.settings.ttsRate}
            tts={state.settings.tts}
            autoSpeak={state.settings.autoSpeak}
            onGrade={(grade, outcome) => reviewInSession(current.id, grade, outcome)}
          />
        ) : null}
        {current && session.mode === "quiz" ? (
          <QuizMode
            key={current.id}
            card={current}
            index={session.index}
            direction={session.direction}
            pool={cards}
            onGrade={(grade, outcome) => reviewInSession(current.id, grade, outcome)}
          />
        ) : null}
        {current && session.mode === "type" ? (
          <TypeMode
            key={current.id}
            card={current}
            index={session.index}
            direction={session.direction}
            onGrade={(grade, outcome) => reviewInSession(current.id, grade, outcome)}
          />
        ) : null}
        {current && session.mode === "listen" ? (
          <ListenMode
            key={current.id}
            card={current}
            index={session.index}
            direction={session.direction}
            pool={cards}
            rate={state.settings.ttsRate}
            tts={state.settings.tts}
            onGrade={(grade, outcome) => reviewInSession(current.id, grade, outcome)}
          />
        ) : null}
        {session.mode === "match" ? (
          <MatchMode
            key={queue.map((card) => card.id).join("|")}
            cards={queue}
            direction={session.direction}
            onLeave={exit}
            onComplete={(results) =>
              reviewMany(
                results.map((item) => ({ id: item.id, grade: item.grade })),
                results.filter((item) => item.correct).map((item) => item.id),
              )
            }
          />
        ) : null}
      </div>
    </div>
  )
}

function Summary({
  session,
  cards,
  title,
  deckId,
}: {
  session: Session
  cards: ReturnType<typeof useAppState>["cards"]
  title: string
  deckId: string
}) {
  const { lang, t } = useI18n()
  const router = useRouter()
  const total = session.correct + session.wrong
  const rate = total ? session.correct / total : 0
  const missed = session.missedIds
    .map((id) => cards.find((card) => card.id === id))
    .filter((card): card is NonNullable<typeof card> => Boolean(card))

  function again(ids: string[], mode: StudyMode) {
    const now = Date.now()
    setSession({
      ...session,
      mode,
      cardIds: ids,
      index: 0,
      phase: "run",
      correct: 0,
      wrong: 0,
      missedIds: [],
      startedAt: now,
      lastTick: now,
      paused: false,
      activeSeconds: 0,
    })
  }

  return (
    <div className="mx-auto grid max-w-xl gap-6 py-6">
      <div>
        <p className="text-xs tracking-wide text-muted-foreground">{title}</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight">{t("summaryTitle")}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t("summaryBody", { correct: session.correct, total: total || session.cardIds.length })}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label={t("accuracy")} value={percent(rate)} />
        <Stat label={t("missed")} value={String(missed.length)} />
        <Stat label={t("timeSpent")} value={formatMinutes(session.activeSeconds || 0, lang)} />
      </div>
      <div>
        <h2 className="text-sm font-medium">{t("missed")}</h2>
        {missed.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("noMissed")}</p>
        ) : (
          <ul className="mt-2 divide-y rounded-2xl border">
            {missed.map((card) => (
              <li key={card.id} className="px-3 py-2 text-sm">
                <span className="font-medium">{card.term}</span>
                <span className="text-muted-foreground"> \u00b7 {card.meaning}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {missed.length > 0 ? (
          <Button type="button" onClick={() => again(missed.map((card) => card.id), session.mode === "match" ? "flash" : session.mode)}>
            {t("retryMissed")}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const queue = buildQueue(cards, session.scope, session.cardIds.length, Date.now(), session.mode !== "flash")
            const ids = (session.mode === "match" ? queue.slice(0, 6) : queue).map((card) => card.id)
            if (ids.length) again(ids, session.mode)
          }}
        >
          {t("studyAgain")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            clearSession()
            router.push(deckId === "all" ? "/" : `/deck/${deckId}`)
          }}
        >
          {deckId === "all" ? t("goHome") : t("backToDeck")}
        </Button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card px-3 py-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-medium tabular-nums">{value}</p>
    </div>
  )
}

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "h-9 rounded-full border px-3 text-sm",
        pressed ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
