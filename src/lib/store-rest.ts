export function makeCard(deckId: string, draft: CardDraft, now = Date.now()): Card {
  return {
    ...draft,
    term: draft.term.trim(),
    meaning: draft.meaning.trim(),
    id: crypto.randomUUID(),
    deckId,
    createdAt: now,
    updatedAt: now,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    due: now,
    lapses: 0,
    reviews: 0,
    correct: 0,
    lastReviewed: null,
  }
}
