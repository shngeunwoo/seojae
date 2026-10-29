"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Volume2 } from "lucide-react"
import { Kbd, Phrase } from "@/components/bits"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatSpan } from "@/lib/format"
import { facing, buildChoices, type Choice } from "@/lib/study"
import { nextIntervalDays } from "@/lib/srs"
import { canSpeak, speak, stopSpeaking } from "@/lib/speech"
import { gradeTyped, shuffle } from "@/lib/text"
import { toggleFavorite } from "@/lib/store"
import type { Card, Direction, Grade, Lang } from "@/lib/types"
import { useI18n } from "@/lib/use-i18n"
import { cn } from "@/lib/utils"

const grades: { grade: Grade; key: "again" | "hard" | "normal" | "good" | "easy" | "perfect"; hotkey: string }[] = [
  { grade: 0, key: "again", hotkey: "1" },
  { grade: 1, key: "hard", hotkey: "2" },
  { grade: 2, key: "normal", hotkey: "3" },
  { grade: 3, key: "good", hotkey: "4" },
  { grade: 4, key: "easy", hotkey: "5" },
  { grade: 5, key: "perfect", hotkey: "6" },
]

export function StudyBar({
  title,
  index,
  total,
  onExit,
  exitLabel,
}: {
  title: string
  index: number
  total: number
  onExit: () => void
  exitLabel: string
}) {
  const { t } = useI18n()
  const pct = total === 0 ? 0 : Math.min(100, (index / total) * 100)
  return (
    <header className="sticky top-0 z-20 bg-background/80 pt-1 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onExit} className="text-sm text-muted-foreground hover:text-foreground">
          {exitLabel}
        </button>
        <p className="min-w-0 truncate text-sm">{title}</p>
        <p className="text-sm tabular-nums text-muted-foreground">
          {t("sessionOf", { index: Math.min(index + 1, total), total })}
        </p>
      </div>
      <div
        className="mt-3 h-1 overflow-hidden rounded-full bg-foreground/10"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </header>
  )
}

export function FlashMode({
  card,
  index,
  direction,
  showExample,
  rate,
  tts,
  autoSpeak,
  onGrade,
}: {
  card: Card
  index: number
  direction: Direction
  showExample: boolean
  rate: number
  tts: boolean
  autoSpeak: boolean
  onGrade: (grade: Grade, outcome: "correct" | "wrong") => void
}) {
  const { lang, t } = useI18n()
  const face = facing(card, direction, index)
  const [shownId, setShownId] = useState<string | null>(null)
  const flipped = shownId === card.id
  const sent = useRef(false)

  useEffect(() => {
    sent.current = false
  }, [card.id])

  useEffect(() => {
    if (!autoSpeak || !tts) return
    void speak(face.prompt, rate)
    return () => stopSpeaking()
  }, [card.id, face.prompt, autoSpeak, tts, rate])

  function toggleFlip() {
    setShownId((current) => (current === card.id ? null : card.id))
  }

  function grade(value: Grade) {
    if (!flipped || sent.current) return
    sent.current = true
    onGrade(value, value === 0 ? "wrong" : "correct")
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (isTyping(event.target)) return
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault()
        toggleFlip()
        return
      }
      if (event.key.toLowerCase() === "s" && tts) {
        event.preventDefault()
        void speak(flipped ? face.answer : face.prompt, rate)
      }
      if (event.key.toLowerCase() === "f") {
        event.preventDefault()
        toggleFavorite(card.id)
      }
      const found = grades.find((item) => item.hotkey === event.key)
      if (found) {
        event.preventDefault()
        if (!flipped) setShownId(card.id)
        else grade(found.grade)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  return (
    <div className="grid gap-5">
      <div className="flip-scene min-h-[22rem] sm:min-h-[26rem]">
        <div className={cn("flip-inner", flipped && "is-flipped")}>
          <CardFace
            kind="front"
            label={t("front")}
            text={face.prompt}
            textLang={face.promptLang}
            hint={t("pressFlip")}
            onClick={toggleFlip}
            action={
              tts ? (
                <SpeakButton label={t("speak")} onClick={() => void speak(face.prompt, rate)} />
              ) : null
            }
          />
          <CardFace
            kind="back"
            label={t("cardBack")}
            text={face.answer}
            textLang={face.answerLang}
            hint={card.notes}
            example={showExample ? face.example : ""}
            exampleTr={showExample ? face.exampleTr : ""}
            onClick={toggleFlip}
            action={
              tts ? (
                <SpeakButton label={t("speak")} onClick={() => void speak(face.answer, rate)} />
              ) : null
            }
          />
        </div>
      </div>
      {flipped ? (
        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {grades.map((item) => (
              <button
                key={item.grade}
                type="button"
                onClick={() => grade(item.grade)}
                className="rounded-2xl border bg-card px-3 py-3 text-left transition hover:border-foreground/30"
              >
                <span className="flex items-center justify-between gap-2 text-sm font-medium">
                  {t(item.key)}
                  <Kbd>{item.hotkey}</Kbd>
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {formatSpan(nextIntervalDays(card, item.grade), lang)}
                </span>
              </button>
            ))}
          </div>
          <Button type="button" variant="outline" className="h-11" onClick={toggleFlip}>
            {t("flipBack")}
          </Button>
        </div>
      ) : (
        <Button type="button" className="h-11" onClick={toggleFlip}>
          {t("reveal")}
        </Button>
      )}
    </div>
  )
}

function CardFace({
  kind,
  label,
  text,
  textLang,
  hint,
  example,
  exampleTr,
  action,
  onClick,
}: {
  kind: "front" | "back"
  label: string
  text: string
  textLang: Lang
  hint?: string
  example?: string
  exampleTr?: string
  action?: ReactNode
  onClick?: () => void
}) {
  return (
    <div className={cn("flip-face shadow-lift rounded-[1.75rem] border bg-card", kind === "back" && "face-back")}>
      <div className="relative z-10 flex h-full flex-col p-6 pointer-events-none sm:p-8">
        <div className="flex items-center justify-between">
          <span className="text-[11px] tracking-wide text-muted-foreground">{label}</span>
          {action}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-2 py-8 text-center">
          <Phrase text={text} lang={textLang} className="text-4xl leading-tight sm:text-5xl" />
          {example ? (
            <p className="mt-6 max-w-md text-sm leading-6 text-muted-foreground">{example}</p>
          ) : null}
          {exampleTr ? <p className="mt-1 max-w-md text-sm leading-6">{exampleTr}</p> : null}
          {hint && !example ? (
            <p className="mt-6 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {onClick ? (
          <button type="button" className="sr-only" onClick={onClick}>
            {label}
          </button>
        ) : null}
      </div>
      {onClick ? (
        <button type="button" aria-label={text} className="absolute inset-0 z-0 rounded-[1.75rem]" onClick={onClick} />
      ) : null}
    </div>
  )
}

function SpeakButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className="pointer-events-auto relative z-10 inline-flex size-9 items-center justify-center rounded-full border bg-background text-muted-foreground hover:text-foreground"
    >
      <Volume2 className="size-4" />
    </button>
  )
}

export function QuizMode({
  card,
  index,
  direction,
  pool,
  onGrade,
}: {
  card: Card
  index: number
  direction: Direction
  pool: readonly Card[]
  onGrade: (grade: Grade, outcome: "correct" | "wrong") => void
}) {
  const { t } = useI18n()
  const face = facing(card, direction, index)
  const [round] = useState(() => ({
    id: card.id,
    choices: choicesFor(card, index, direction, pool),
  }))
  const [picked, setPicked] = useState<string | null>(null)
  const sent = useRef(false)

  function choose(choice: Choice) {
    if (picked || sent.current) return
    setPicked(choice.id)
    sent.current = true
    window.setTimeout(() => {
      onGrade(choice.correct ? 3 : 0, choice.correct ? "correct" : "wrong")
    }, choice.correct ? 620 : 1100)
  }

  return (
    <div className="grid gap-5">
      <div className="shadow-lift rounded-[1.75rem] border bg-card px-6 py-10 text-center sm:px-10">
        <p className="text-[11px] tracking-wide text-muted-foreground">{t("modeQuiz")}</p>
        <Phrase text={face.prompt} lang={face.promptLang} className="mt-4 text-4xl sm:text-5xl" />
      </div>
      <div className="grid gap-2">
        {round.choices.map((choice) => {
          const selected = picked === choice.id
          const reveal = picked !== null
          return (
            <button
              key={choice.id}
              type="button"
              disabled={reveal}
              onClick={() => choose(choice)}
              className={cn(
                "min-h-14 rounded-2xl border bg-card px-4 py-3 text-left text-base transition hover:border-foreground/30 disabled:hover:border-border",
                reveal && choice.correct && "border-primary bg-primary/10",
                reveal && selected && !choice.correct && "border-destructive bg-destructive/10",
              )}
            >
              {choice.text}
            </button>
          )
        })}
      </div>
      <p className="min-h-5 text-center text-sm" aria-live="polite">
        {picked
          ? round.choices.find((choice) => choice.id === picked)?.correct
            ? t("correct")
            : t("incorrect")
          : ""}
      </p>
    </div>
  )
}

function choicesFor(card: Card, index: number, direction: Direction, pool: readonly Card[]) {
  const face = facing(card, direction, index)
  const answers = pool
    .filter((item) => item.id !== card.id)
    .map((item) => facing(item, direction, index).answer)
  return buildChoices(face.answer, answers)
}

export function TypeMode({
  card,
  index,
  direction,
  onGrade,
}: {
  card: Card
  index: number
  direction: Direction
  onGrade: (grade: Grade, outcome: "correct" | "wrong") => void
}) {
  const { t } = useI18n()
  const face = facing(card, direction, index)
  const [value, setValue] = useState("")
  const [hint, setHint] = useState("")
  const [result, setResult] = useState<"correct" | "close" | "wrong" | null>(null)
  const hinted = useRef(false)
  const sent = useRef(false)

  function submit(text: string) {
    if (result || sent.current) return
    const grade = gradeTyped(text, face.answer)
    if (grade === "wrong") {
      setResult("wrong")
      return
    }
    setResult(grade)
    sent.current = true
    const score: Grade = grade === "correct" && !hinted.current ? 3 : 1
    window.setTimeout(() => onGrade(score, "correct"), grade === "close" ? 900 : 520)
  }

  function revealWrong() {
    if (sent.current) return
    sent.current = true
    onGrade(0, "wrong")
  }

  return (
    <div className="grid gap-5">
      <div className="shadow-lift rounded-[1.75rem] border bg-card px-6 py-10 text-center sm:px-10">
        <p className="text-[11px] tracking-wide text-muted-foreground">{t("modeType")}</p>
        <Phrase text={face.prompt} lang={face.promptLang} className="mt-4 text-4xl sm:text-5xl" />
      </div>
      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (result === "wrong") revealWrong()
          else submit(value)
        }}
      >
        <Input
          key={card.id}
          value={value}
          autoFocus
          placeholder={hint || t("typePlaceholder")}
          aria-label={t("typePlaceholder")}
          className="h-12 text-base"
          onChange={(event) => setValue(event.target.value)}
          disabled={result !== null && result !== "wrong"}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-10" onClick={() => {
            hinted.current = true
            const letter = Array.from(face.answer.trim())[0] ?? ""
            setHint(letter)
          }}>
            {t("hint")}
          </Button>
          <Button type="submit" className="h-10 flex-1">
            {result === "wrong" ? t("next") : t("check")}
          </Button>
        </div>
      </form>
      <p className="min-h-10 text-center text-sm" aria-live="polite">
        {result === "correct" ? t("correct") : null}
        {result === "close" ? (
          <>
            {t("almost")}
            <span className="mt-1 block text-muted-foreground">{t("answerWas", { answer: face.answer })}</span>
          </>
        ) : null}
        {result === "wrong" ? (
          <>
            {t("incorrect")}
            <span className="mt-1 block text-muted-foreground">{t("answerWas", { answer: face.answer })}</span>
          </>
        ) : null}
      </p>
    </div>
  )
}

export function ListenMode({
  card,
  index,
  direction,
  pool,
  rate,
  tts,
  onGrade,
}: {
  card: Card
  index: number
  direction: Direction
  pool: readonly Card[]
  rate: number
  tts: boolean
  onGrade: (grade: Grade, outcome: "correct" | "wrong") => void
}) {
  const { t } = useI18n()
  const face = facing(card, direction, index)
  const [speechOk, setSpeechOk] = useState(false)
  useEffect(() => {
    setSpeechOk(canSpeak())
  }, [])
  const [round] = useState(() => ({
    id: card.id,
    choices: choicesFor(card, index, direction, pool),
  }))
  const [picked, setPicked] = useState<string | null>(null)
  const sent = useRef(false)

  useEffect(() => {
    if (!tts || !canSpeak()) return
    void speak(face.prompt, rate)
    return () => stopSpeaking()
  }, [card.id, face.prompt, rate, tts])

  function choose(choice: Choice) {
    if (picked || sent.current) return
    setPicked(choice.id)
    sent.current = true
    window.setTimeout(() => {
      onGrade(choice.correct ? 3 : 0, choice.correct ? "correct" : "wrong")
    }, choice.correct ? 620 : 1100)
  }

  return (
    <div className="grid gap-5">
      <div className="shadow-lift flex flex-col items-center rounded-[1.75rem] border bg-card px-6 py-10 text-center">
        <p className="text-[11px] tracking-wide text-muted-foreground">{t("listenPrompt")}</p>
        {speechOk && tts ? (
          <button
            type="button"
            onClick={() => void speak(face.prompt, rate)}
            className="mt-6 inline-flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-label={t("replay")}
          >
            <Volume2 className="size-7" />
          </button>
        ) : (
          <Phrase text={face.prompt} lang={face.promptLang} className="mt-6 text-4xl" />
        )}
        {!speechOk || !tts ? <p className="mt-4 max-w-sm text-sm text-muted-foreground">{t("ttsMissing")}</p> : (
          <p className="mt-4 text-sm text-muted-foreground">{t("replay")}</p>
        )}
      </div>
      <div className="grid gap-2">
        {round.choices.map((choice) => {
          const reveal = picked !== null
          const selected = picked === choice.id
          return (
            <button
              key={choice.id}
              type="button"
              disabled={reveal}
              onClick={() => choose(choice)}
              className={cn(
                "min-h-14 rounded-2xl border bg-card px-4 py-3 text-left transition hover:border-foreground/30",
                reveal && choice.correct && "border-primary bg-primary/10",
                reveal && selected && !choice.correct && "border-destructive bg-destructive/10",
              )}
            >
              {choice.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}

type Tile = { id: string; cardId: string; text: string; lang: Lang }

export function MatchMode({
  cards,
  direction,
  onComplete,
  onLeave,
}: {
  cards: Card[]
  direction: Direction
  onComplete: (results: { id: string; grade: Grade; correct: boolean }[]) => void
  onLeave: () => void
}) {
  const { t } = useI18n()
  const [board] = useState(() => makeTiles(cards, direction))
  const [selected, setSelected] = useState<string[]>([])
  const [matched, setMatched] = useState<string[]>([])
  const [wrong, setWrong] = useState<string[]>([])
  const [moves, setMoves] = useState(0)
  const mistakes = useRef(new Set<string>())
  const done = useRef(false)

  if (cards.length < 3) {
    return (
      <div className="rounded-3xl border border-dashed px-6 py-16 text-center">
        <p className="font-medium">{t("matchNeed")}</p>
        <Button type="button" className="mt-5" onClick={onLeave}>
          {t("back")}
        </Button>
      </div>
    )
  }

  function pick(tile: Tile) {
    if (matched.includes(tile.id) || selected.includes(tile.id) || wrong.length) return
    const next = [...selected, tile.id]
    if (next.length < 2) {
      setSelected(next)
      return
    }
    setMoves((count) => count + 1)
    const [firstId] = next
    const first = board.find((item) => item.id === firstId)
    if (first && first.cardId === tile.cardId) {
      const paired = [...matched, first.id, tile.id]
      setMatched(paired)
      setSelected([])
      if (paired.length >= board.length && !done.current) {
        done.current = true
        const results = cards.map((card) => {
          const correct = !mistakes.current.has(card.id)
          return { id: card.id, grade: (correct ? 3 : 1) as Grade, correct }
        })
        window.setTimeout(() => onComplete(results), 450)
      }
      return
    }
    if (first) {
      mistakes.current.add(first.cardId)
      mistakes.current.add(tile.cardId)
    }
    setSelected(next)
    setWrong(next)
    window.setTimeout(() => {
      setSelected([])
      setWrong([])
    }, 520)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{t("matchPrompt")}</span>
        <span className="tabular-nums">{t("matchMoves", { n: moves })}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {board.map((tile) => {
          const isMatched = matched.includes(tile.id)
          const isSelected = selected.includes(tile.id)
          const isWrong = wrong.includes(tile.id)
          return (
            <button
              key={tile.id}
              type="button"
              disabled={isMatched}
              onClick={() => pick(tile)}
              className={cn(
                "min-h-24 rounded-2xl border bg-card px-3 py-3 text-center transition",
                isSelected && "border-primary",
                isWrong && "shake border-destructive",
                isMatched && "border-transparent bg-primary/10 opacity-60",
              )}
            >
              <Phrase text={tile.text} lang={tile.lang} className="text-lg" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function makeTiles(cards: Card[], direction: Direction): Tile[] {
  const tiles = cards.slice(0, 6).flatMap((card, index) => {
    const face = facing(card, direction, index)
    return [
      { id: `${card.id}:p`, cardId: card.id, text: face.prompt, lang: face.promptLang },
      { id: `${card.id}:a`, cardId: card.id, text: face.answer, lang: face.answerLang },
    ]
  })
  return shuffle(tiles)
}

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable
}
