import { dayKey, formatAhead, shiftDay } from "@/lib/format"
import { isDue, isWeak, masteryOf } from "@/lib/srs"
import type { Card, DayLog, Deck, Lang, Runtime } from "@/lib/types"

export function deckTitle(deck: Deck, lang: Lang) {
  if (lang === "en" && deck.nameEn.trim()) return deck.nameEn
  return deck.name
}

export function deckBlurb(deck: Deck, lang: Lang) {
  if (lang === "en" && deck.descriptionEn.trim()) return deck.descriptionEn
  return deck.description
}

export function cardsForDeck(cards: readonly Card[], deckId: string) {
  if (deckId === "all") return cards
  return cards.filter((card) => card.deckId === deckId)
}

export function todayParts(cards: readonly Card[], now: number) {
  let fresh = 0
  let review = 0
  let mastered = 0
  for (const card of cards) {
    if (masteryOf(card) === "mastered") mastered += 1
    if (!isDue(card, now)) continue
    if (card.lastReviewed == null) fresh += 1
    else review += 1
  }
  return { fresh, review, mastered, today: fresh + review }
}

export function streakCount(logs: Record<string, DayLog>, today: string) {
  let cursor = (logs[today]?.reviews ?? 0) > 0 ? today : shiftDay(today, -1)
  let count = 0
  while ((logs[cursor]?.reviews ?? 0) > 0 && count < 5000) {
    count += 1
    cursor = shiftDay(cursor, -1)
  }
  return count
}

export function recentStats(logs: Record<string, DayLog>, today: string, days = 7) {
  let reviews = 0
  let correct = 0
  let seconds = 0
  let cursor = today
  for (let i = 0; i < days; i++) {
    const log = logs[cursor]
    if (log) {
      reviews += log.reviews
      correct += log.correct
      seconds += log.seconds
    }
    cursor = shiftDay(cursor, -1)
  }
  return { reviews, correct, seconds, rate: reviews ? correct / reviews : 0 }
}

export function heatmap(today: string, weeks = 16) {
  const [y, m, d] = today.split("-").map(Number)
  const date = new Date(y, (m || 1) - 1, d || 1)
  const weekday = date.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  const start = new Date(date)
  start.setDate(date.getDate() + mondayOffset - (weeks - 1) * 7)
  const days: { key: string; future: boolean }[] = []
  for (let i = 0; i < weeks * 7; i++) {
    const cursor = new Date(start)
    cursor.setDate(start.getDate() + i)
    const key = dayKey(cursor.getTime())
    days.push({ key, future: key > today })
  }
  return days
}

export function hardestCards(cards: readonly Card[], limit = 5) {
  return cards
    .filter((card) => card.reviews >= 2 && card.correct < card.reviews)
    .slice()
    .sort((a, b) => a.correct / a.reviews - b.correct / b.reviews || b.lapses - a.lapses)
    .slice(0, limit)
}

export function dueLabel(card: Card, lang: Lang, now: number) {
  if (card.lastReviewed == null) return lang === "ko" ? "새 단어" : "New"
  if (isDue(card, now)) return lang === "ko" ? "오늘" : "Today"
  return formatAhead(card.due - now, lang)
}

export function weakCount(cards: readonly Card[]) {
  return cards.reduce((sum, card) => sum + (isWeak(card) ? 1 : 0), 0)
}

export function libraryToday(state: Runtime) {
  return dayKey(state.clock || Date.now())
}
