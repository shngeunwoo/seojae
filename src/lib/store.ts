"use client"

import { useSyncExternalStore } from "react"
import { dayKey } from "@/lib/format"
import { createSeed } from "@/lib/seed"
import { defaultSettings } from "@/lib/settings"
import { applyReview } from "@/lib/srs"
import { normalizeAnswer } from "@/lib/text"
import type {
  Card,
  CardDraft,
  Deck,
  DeckColor,
  Grade,
  Persisted,
  Runtime,
  Session,
  Settings,
} from "@/lib/types"
import { DECK_COLORS, PARTS } from "@/lib/types"

export const STORAGE_KEY = "seojae.v1"
const SESSION_KEY = "seojae.session"

const SERVER_STATE: Runtime = {
  version: 1,
  decks: [],
  cards: [],
  settings: defaultSettings,
  logs: {},
  ready: false,
  session: null,
  clock: 0,
}

let runtime: Runtime = SERVER_STATE
let loaded = false
const listeners = new Set<() => void>()
let persistTimer: number | null = null

function emptyLog() {
  return { reviews: 0, correct: 0, seconds: 0 }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function normalizeDeck(value: unknown, now: number): Deck | null {
  if (!isRecord(value) || typeof value.name !== "string" || !value.name.trim()) return null
  const color = DECK_COLORS.includes(value.color as DeckColor)
    ? (value.color as DeckColor)
    : "pine"
  const id = typeof value.id === "string" && value.id ? value.id : crypto.randomUUID()
  return {
    id,
    name: value.name.trim().slice(0, 80),
    nameEn: typeof value.nameEn === "string" ? value.nameEn.trim().slice(0, 80) : "",
    description: typeof value.description === "string" ? value.description.trim().slice(0, 180) : "",
    descriptionEn:
      typeof value.descriptionEn === "string" ? value.descriptionEn.trim().slice(0, 180) : "",
    color,
    createdAt: typeof value.createdAt === "number" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : now,
  }
}

function normalizeCard(value: unknown, deckIds: Set<string>, now: number): Card | null {
  if (!isRecord(value)) return null
  const term = typeof value.term === "string" ? value.term.trim() : ""
  const meaning = typeof value.meaning === "string" ? value.meaning.trim() : ""
  const deckId = typeof value.deckId === "string" ? value.deckId : ""
  if (!term || !meaning || !deckIds.has(deckId)) return null
  const pos = PARTS.includes(value.pos as Card["pos"]) ? (value.pos as Card["pos"]) : "other"
  const tags = Array.isArray(value.tags)
    ? value.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean).slice(0, 8)
    : []
  return {
    id: typeof value.id === "string" && value.id ? value.id : crypto.randomUUID(),
    deckId,
    term: term.slice(0, 120),
    meaning: meaning.slice(0, 200),
    termLang: value.termLang === "ko" ? "ko" : "en",
    meaningLang: value.meaningLang === "en" ? "en" : "ko",
    example: typeof value.example === "string" ? value.example.slice(0, 400) : "",
    exampleMeaning: typeof value.exampleMeaning === "string" ? value.exampleMeaning.slice(0, 400) : "",
    pos,
    tags,
    notes: typeof value.notes === "string" ? value.notes.slice(0, 800) : "",
    favorite: Boolean(value.favorite),
    createdAt: typeof value.createdAt === "number" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : now,
    ease: typeof value.ease === "number" && value.ease >= 1.3 ? value.ease : 2.5,
    interval: typeof value.interval === "number" && value.interval >= 0 ? value.interval : 0,
    repetitions: typeof value.repetitions === "number" && value.repetitions >= 0 ? value.repetitions : 0,
    due: typeof value.due === "number" ? value.due : now,
    lapses: typeof value.lapses === "number" && value.lapses >= 0 ? value.lapses : 0,
    reviews: typeof value.reviews === "number" && value.reviews >= 0 ? value.reviews : 0,
    correct: typeof value.correct === "number" && value.correct >= 0 ? value.correct : 0,
    lastReviewed: typeof value.lastReviewed === "number" ? value.lastReviewed : null,
  }
}

export function normalizePersisted(value: unknown): Persisted | null {
  if (!isRecord(value)) return null
  const now = Date.now()
  const decks = Array.isArray(value.decks)
    ? value.decks.map((deck) => normalizeDeck(deck, now)).filter((deck): deck is Deck => Boolean(deck))
    : []
  const deckIds = new Set(decks.map((deck) => deck.id))
  const cards = Array.isArray(value.cards)
    ? value.cards
        .map((card) => normalizeCard(card, deckIds, now))
        .filter((card): card is Card => Boolean(card))
    : []
  if (!Array.isArray(value.decks) || !Array.isArray(value.cards)) return null
  const settings = {
    ...defaultSettings,
    ...(isRecord(value.settings) ? value.settings : {}),
  }
  const safeSettings: Settings = {
    uiLang: settings.uiLang === "en" ? "en" : "ko",
    theme: settings.theme === "light" || settings.theme === "dark" ? settings.theme : "system",
    dailyGoal:
      typeof settings.dailyGoal === "number"
        ? Math.min(200, Math.max(5, Math.round(settings.dailyGoal)))
        : defaultSettings.dailyGoal,
    tts: settings.tts !== false,
    ttsRate:
      typeof settings.ttsRate === "number"
        ? Math.min(1.25, Math.max(0.75, settings.ttsRate))
        : defaultSettings.ttsRate,
    autoSpeak: Boolean(settings.autoSpeak),
    showExample: settings.showExample !== false,
  }
  const logs: Persisted["logs"] = {}
  if (isRecord(value.logs)) {
    for (const [key, entry] of Object.entries(value.logs)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !isRecord(entry)) continue
      logs[key] = {
        reviews: typeof entry.reviews === "number" ? entry.reviews : 0,
        correct: typeof entry.correct === "number" ? entry.correct : 0,
        seconds: typeof entry.seconds === "number" ? entry.seconds : 0,
      }
    }
  }
  return { version: 1, decks, cards, settings: safeSettings, logs }
}

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Session
    if (!value || !Array.isArray(value.cardIds) || !value.deckId || !value.mode) return null
    return value
  } catch {
    return null
  }
}

function writeSession(session: Session | null) {
  try {
    if (!session) sessionStorage.removeItem(SESSION_KEY)
    else sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* private mode or a full quota */
  }
}

function persistedSlice(state: Runtime): Persisted {
  return {
    version: 1,
    decks: state.decks,
    cards: state.cards,
    settings: state.settings,
    logs: state.logs,
  }
}

function schedulePersist() {
  if (typeof window === "undefined") return
  if (persistTimer) window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(() => {
    persistTimer = null
    flushPersist()
  }, 140)
}

export function flushPersist() {
  if (typeof window === "undefined" || !loaded) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedSlice(runtime)))
  } catch {
    /* ignore quota */
  }
}

function loadFromDisk(): Runtime {
  const now = Date.now()
  let persisted = createSeed(now)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      persisted = normalizePersisted(JSON.parse(raw)) ?? createSeed(now)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    }
  } catch {
    persisted = createSeed(now)
  }
  return { ...persisted, ready: true, session: readSession(), clock: now }
}

function ensure() {
  if (loaded || typeof window === "undefined") return
  runtime = loadFromDisk()
  loaded = true
}

function getSnapshot() {
  ensure()
  return runtime
}

function getServerSnapshot() {
  return SERVER_STATE
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function commit(next: Runtime, options?: { persist?: boolean; session?: boolean }) {
  runtime = { ...next, ready: true, clock: Date.now() }
  if (options?.session !== false) writeSession(runtime.session)
  if (options?.persist !== false) schedulePersist()
  listeners.forEach((listener) => listener())
}

export function useAppState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

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

export function updateSettings(patch: Partial<Settings>) {
  ensure()
  commit({ ...runtime, settings: { ...runtime.settings, ...patch } })
}

export function addDeck(input: { name: string; description: string; color: DeckColor }) {
  ensure()
  const now = Date.now()
  const deck: Deck = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    nameEn: "",
    description: input.description.trim(),
    descriptionEn: "",
    color: input.color,
    createdAt: now,
    updatedAt: now,
  }
  commit({ ...runtime, decks: [deck, ...runtime.decks] })
  return deck
}

export function updateDeck(
  id: string,
  patch: Partial<Pick<Deck, "name" | "description" | "color">>,
) {
  ensure()
  const now = Date.now()
  commit({
    ...runtime,
    decks: runtime.decks.map((deck) =>
      deck.id === id
        ? {
            ...deck,
            ...patch,
            name: patch.name?.trim() || deck.name,
            description: patch.description?.trim() ?? deck.description,
            updatedAt: now,
          }
        : deck,
    ),
  })
}

export function deleteDeck(id: string) {
  ensure()
  const session = runtime.session?.deckId === id ? null : runtime.session
  commit({
    ...runtime,
    decks: runtime.decks.filter((deck) => deck.id !== id),
    cards: runtime.cards.filter((card) => card.deckId !== id),
    session,
  })
}

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
  const next = normalizePersisted(data) ?? createSeed(Date.now())
  commit({
    ...next,
    settings: runtime.settings,
    ready: true,
    session: null,
    clock: Date.now(),
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
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
