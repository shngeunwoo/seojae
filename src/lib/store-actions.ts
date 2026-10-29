function touchDeck(decks: Deck[], deckId: string, now: number) {
  return decks.map((deck) => (deck.id === deckId ? { ...deck, updatedAt: now } : deck))
}

export function addCard(deckId: string, draft: CardDraft) {
  ensure()
  const now = Date.now()
  const card = makeCard(deckId, draft, now)
  commit({
    ...runtime,
    cards: [card, ...runtime.cards],
    decks: touchDeck(runtime.decks, deckId, now),
  })
  return card
}

export function addDrafts(deckId: string, drafts: CardDraft[]) {
  ensure()
  const seen = new Set(
    runtime.cards
      .filter((card) => card.deckId === deckId)
      .map((card) => normalizeAnswer(card.term)),
  )
  const now = Date.now()
  const cards = runtime.cards.slice()
  let added = 0
  let skipped = 0
  for (const draft of drafts) {
    const key = normalizeAnswer(draft.term)
    if (!key || !draft.meaning.trim()) continue
    if (seen.has(key)) {
      skipped += 1
      continue
    }
    seen.add(key)
    cards.unshift(makeCard(deckId, draft, now + added))
    added += 1
  }
  commit({
    ...runtime,
    cards,
    decks: added ? touchDeck(runtime.decks, deckId, now) : runtime.decks,
  })
  return { added, skipped }
}

export function updateCard(id: string, draft: CardDraft) {
  ensure()
  const now = Date.now()
  let deckId = ""
  const cards = runtime.cards.map((card) => {
    if (card.id !== id) return card
    deckId = card.deckId
    return { ...card, ...draft, term: draft.term.trim(), meaning: draft.meaning.trim(), updatedAt: now }
  })
  commit({ ...runtime, cards, decks: touchDeck(runtime.decks, deckId, now) })
}

export function deleteCard(id: string) {
  ensure()
  const card = runtime.cards.find((item) => item.id === id) ?? null
  if (!card) return null
  commit({ ...runtime, cards: runtime.cards.filter((item) => item.id !== id) })
  return card
}

export function restoreCard(card: Card) {
  ensure()
  if (runtime.cards.some((item) => item.id === card.id)) return
  if (!runtime.decks.some((deck) => deck.id === card.deckId)) return
  commit({ ...runtime, cards: [card, ...runtime.cards] })
}

export function toggleFavorite(id: string) {
  ensure()
  commit({
    ...runtime,
    cards: runtime.cards.map((card) =>
      card.id === id ? { ...card, favorite: !card.favorite, updatedAt: Date.now() } : card,
    ),
  })
}

export function hasDuplicate(deckId: string, term: string, exceptId?: string) {
  ensure()
  const key = normalizeAnswer(term)
  return runtime.cards.some(
    (card) => card.deckId === deckId && card.id !== exceptId && normalizeAnswer(card.term) === key,
  )
}

function withLog(state: Runtime, now: number, reviews: number, correct: number, seconds = 0) {
  const key = dayKey(now)
  const prev = state.logs[key] ?? emptyLog()
  return {
    ...state.logs,
    [key]: {
      reviews: prev.reviews + reviews,
      correct: prev.correct + correct,
      seconds: prev.seconds + seconds,
    },
  }
}

export function setSession(session: Session | null) {
  ensure()
  commit({ ...runtime, session }, { persist: false })
}

export function clearSession() {
  ensure()
  flushStudyTime()
  commit({ ...runtime, session: null })
}

export function flushStudyTime() {
  if (!loaded || !runtime.session) return runtime.session
  const now = Date.now()
  const from = runtime.session.lastTick || runtime.session.startedAt
  const delta = Math.max(0, Math.round((now - from) / 1000))
  const session = {
    ...runtime.session,
    lastTick: now,
    activeSeconds: (runtime.session.activeSeconds || 0) + delta,
  }
  commit(
    {
      ...runtime,
      session,
      logs: delta > 0 ? withLog(runtime, now, 0, 0, delta) : runtime.logs,
    },
    { persist: delta > 0 },
  )
  return session
}

export function reviewInSession(cardId: string, grade: Grade, outcome: "correct" | "wrong") {
  ensure()
  const now = Date.now()
  const cards = runtime.cards.map((card) =>
    card.id === cardId ? applyReview(card, grade, now) : card,
  )
  const session = runtime.session
    ? {
        ...runtime.session,
        index: runtime.session.index + 1,
        correct: runtime.session.correct + (outcome === "correct" ? 1 : 0),
        wrong: runtime.session.wrong + (outcome === "wrong" ? 1 : 0),
        missedIds:
          outcome === "wrong" ? [...runtime.session.missedIds, cardId] : runtime.session.missedIds,
      }
    : null
  commit({
    ...runtime,
    cards,
    session,
    logs: withLog(runtime, now, 1, outcome === "correct" ? 1 : 0),
  })
}

export function reviewMany(results: { id: string; grade: Grade }[], correctIds: string[]) {
  ensure()
  const now = Date.now()
  const grades = new Map(results.map((item) => [item.id, item.grade]))
  const correct = new Set(correctIds)
  const cards = runtime.cards.map((card) => {
    const grade = grades.get(card.id)
    return grade === undefined ? card : applyReview(card, grade, now)
  })
  const session = runtime.session
    ? {
        ...runtime.session,
        index: runtime.session.cardIds.length,
        phase: "summary" as const,
        correct: correctIds.length,
        wrong: results.length - correctIds.length,
        missedIds: results.filter((item) => !correct.has(item.id)).map((item) => item.id),
      }
    : null
  commit({
    ...runtime,
    cards,
    session,
    logs: withLog(runtime, now, results.length, correctIds.length),
  })
}

export function markSummary() {
  ensure()
  if (!runtime.session) return
  flushStudyTime()
  commit({ ...runtime, session: { ...runtime.session, phase: "summary" } })
}

export function replaceLibrary(data: Persisted) {
  ensure()
  const now = Date.now()
  const next = withCatalogDecks(normalizePersisted(data) ?? createSeed(now), now)
  commit({
    ...next,
    settings: runtime.settings,
    catalogRev: next.catalogRev,
    ready: true,
    session: null,
    clock: now,
  })
}

export function mergeLibrary(data: Persisted) {
  ensure()
  const incoming = normalizePersisted(data)
  if (!incoming) return { decks: 0, cards: 0 }
  const deckIdMap = new Map<string, string>()
  const decks = runtime.decks.slice()
  const knownDecks = new Set(decks.map((deck) => deck.id))
  let deckCount = 0
  for (const deck of incoming.decks) {
    const id = knownDecks.has(deck.id) ? crypto.randomUUID() : deck.id
    knownDecks.add(id)
    deckIdMap.set(deck.id, id)
    decks.push({ ...deck, id })
    deckCount += 1
  }
  const knownCards = new Set(runtime.cards.map((card) => card.id))
  const cards = runtime.cards.slice()
  let cardCount = 0
  for (const card of incoming.cards) {
    const deckId = deckIdMap.get(card.deckId) ?? card.deckId
    if (!knownDecks.has(deckId)) continue
    let id = card.id
    if (knownCards.has(id)) id = crypto.randomUUID()
    knownCards.add(id)
    cards.push({ ...card, id, deckId })
    cardCount += 1
  }
  commit({ ...runtime, decks, cards, session: null })
  return { decks: deckCount, cards: cardCount }
}

export function restoreSample() {
  ensure()
  const sample = createSeed(Date.now())
  commit({
    ...sample,
    settings: runtime.settings,
    ready: true,
    session: null,
    clock: Date.now(),
  })
}

export function wipeLibrary() {
  ensure()
  commit({
    ...runtime,
    decks: [],
    cards: [],
    logs: {},
    catalogRev: CATALOG_REV,
    session: null,
  })
}

export function bumpClock() {
  if (!loaded) return
  runtime = { ...runtime, clock: Date.now() }
  listeners.forEach((listener) => listener())
}

export function exportJson() {
  ensure()
  return JSON.stringify(persistedSlice(runtime), null, 2)
}

export function downloadText(filename: string, text: string, type: string) {
  void saveTextFile(filename, text, type)
}

async function saveTextFile(filename: string, text: string, type: string) {
  try {
    const { isNativeApp, shareTextFile } = await import("@/lib/native")
    if (isNativeApp()) {
      await shareTextFile(filename, text)
      return
    }
  } catch {
    // Fall through to the browser download path.
  }
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
