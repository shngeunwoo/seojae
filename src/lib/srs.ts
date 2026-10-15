import type { Card, Grade, Mastery } from "@/lib/types"

const MIN_EASE = 1.3

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
  if (grade === 2) return 4
  return 5
}

export function nextIntervalDays(card: Card, grade: Grade) {
  if (grade === 0) return 10 / (24 * 60)
  if (card.repetitions === 0) {
    if (grade === 1) return 0.5
    if (grade === 3) return 4
    return 1
  }
  if (card.repetitions === 1) {
    if (grade === 1) return 1
    if (grade === 3) return 8
    return 3
  }
  const factor = grade === 1 ? 1.2 : grade === 3 ? card.ease * 1.15 : card.ease
  return Math.max(1, Math.round(card.interval * factor * 10) / 10)
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
