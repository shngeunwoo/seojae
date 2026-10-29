import type { Card, Grade, Mastery } from "@/lib/types"

const MIN_EASE = 1.3
const MINUTE = 1 / (24 * 60)
const HOUR = 1 / 24

export const GRADE_INTERVAL_DAYS: Record<Grade, number> = {
  0: 1 * MINUTE,
  1: 10 * MINUTE,
  2: 1 * HOUR,
  3: 6 * HOUR,
  4: 12 * HOUR,
  5: 4,
}

export function masteryOf(card: Card): Mastery {
  if (card.lastReviewed == null) return "new"
  if (card.interval < 1 || card.repetitions < 2) return "learning"
  if (card.interval < 21) return "review"
  return "mastered"
}

export function isWeak(card: Card) {
  if (card.reviews < 1) return false
  if (card.lapses > 0 && card.reviews < 4) return true
  return card.reviews >= 2 && card.correct / card.reviews < 0.75
}

export function isDue(card: Card, now: number) {
  return card.due <= now
}

function quality(grade: Grade) {
  if (grade === 0) return 1
  if (grade === 1) return 3
  if (grade === 2) return 3
  if (grade === 3) return 4
  if (grade === 4) return 4
  return 5
}

export function nextIntervalDays(_card: Card, grade: Grade) {
  return GRADE_INTERVAL_DAYS[grade]
}

export function applyReview(card: Card, grade: Grade, now: number): Card {
  const q = quality(grade)
  let ease = card.ease
  let repetitions = card.repetitions
  let lapses = card.lapses
  const interval = nextIntervalDays(card, grade)

  if (q < 3) {
    repetitions = 0
    lapses += 1
    ease = Math.max(MIN_EASE, ease - 0.2)
  } else {
    repetitions += 1
    ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if (grade === 1) ease -= 0.14
    if (grade === 5) ease += 0.05
    ease = Math.max(MIN_EASE, Math.round(ease * 100) / 100)
  }

  return {
    ...card,
    ease,
    interval,
    repetitions,
    lapses,
    due: now + interval * 86_400_000,
    reviews: card.reviews + 1,
    correct: card.correct + (q >= 3 ? 1 : 0),
    lastReviewed: now,
    updatedAt: now,
  }
}
