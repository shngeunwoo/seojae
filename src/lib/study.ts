import { isDue, isWeak, masteryOf } from "@/lib/srs"
import { shuffle } from "@/lib/text"
import type { Card, Direction, Mastery, Scope } from "@/lib/types"

export type Face = {
  reversed: boolean
  prompt: string
  answer: string
  promptLang: Card["termLang"]
  answerLang: Card["meaningLang"]
  example: string
  exampleTr: string
}

export function isReversed(direction: Direction, index: number) {
  if (direction === "reverse") return true
  if (direction === "mix") return index % 2 === 1
  return false
}

export function facing(card: Card, direction: Direction, index: number): Face {
  const reversed = isReversed(direction, index)
  if (!reversed) {
    return {
      reversed,
      prompt: card.term,
      answer: card.meaning,
      promptLang: card.termLang,
      answerLang: card.meaningLang,
      example: card.example,
      exampleTr: card.exampleMeaning,
    }
  }
  return {
    reversed,
    prompt: card.meaning,
    answer: card.term,
    promptLang: card.meaningLang,
    answerLang: card.termLang,
    example: card.exampleMeaning,
    exampleTr: card.example,
  }
}

export function inScope(card: Card, scope: Scope, now: number) {
  if (scope === "today") return isDue(card, now)
  if (scope === "new") return card.lastReviewed == null
  if (scope === "weak") return isWeak(card)
  if (scope === "starred") return card.favorite
  return true
}

export function scopeCount(cards: readonly Card[], scope: Scope, now: number) {
  if (scope === "all") return cards.length
  return cards.reduce((sum, card) => sum + (inScope(card, scope, now) ? 1 : 0), 0)
}

export function buildQueue(
  cards: readonly Card[],
  scope: Scope,
  limit: number,
  now: number,
  randomize: boolean,
) {
  const pool = cards
    .filter((card) => inScope(card, scope, now))
    .slice()
    .sort((a, b) => a.due - b.due || a.createdAt - b.createdAt)
  const sliced = limit > 0 ? pool.slice(0, limit) : pool
  return randomize ? shuffle(sliced) : sliced
}

export function matchesMastery(card: Card, filter: "all" | Mastery | "starred") {
  if (filter === "all") return true
  if (filter === "starred") return card.favorite
  return masteryOf(card) === filter
}

export type Choice = {
  id: string
  text: string
  correct: boolean
}

export function buildChoices(
  answer: string,
  pool: readonly string[],
  count = 4,
): Choice[] {
  const norm = (value: string) => value.normalize("NFC").trim().toLowerCase()
  const seen = new Set([norm(answer)])
  const distractors: string[] = []
  for (const item of shuffle(pool)) {
    const text = item.trim()
    const key = norm(text)
    if (!key || seen.has(key)) continue
    seen.add(key)
    distractors.push(text)
    if (distractors.length >= count - 1) break
  }
  return shuffle([
    { text: answer, correct: true },
    ...distractors.map((text) => ({ text, correct: false })),
  ]).map((choice, index) => ({
    ...choice,
    id: `${index}-${choice.correct ? "y" : "n"}`,
  }))
}
