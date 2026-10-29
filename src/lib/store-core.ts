"use client"

import { useSyncExternalStore } from "react"
import { createSeed, withCatalogDecks } from "@/lib/seed"
import { defaultSettings } from "@/lib/settings"
import type {
  Card,
  CardDraft,
  Deck,
  DeckColor,
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
  catalogRev: 0,
  ready: false,
  session: null,
  clock: 0,
}

export let runtime: Runtime = SERVER_STATE
export let loaded = false
const listeners = new Set<() => void>()
let persistTimer: number | null = null

export function emptyLog() {
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
  const catalogRev =
    typeof value.catalogRev === "number" && value.catalogRev >= 0
      ? Math.floor(value.catalogRev)
      : 0
  return { version: 1, decks, cards, settings: safeSettings, logs, catalogRev }
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

export function persistedSlice(state: Runtime): Persisted {
  return {
    version: 1,
    decks: state.decks,
    cards: state.cards,
    settings: state.settings,
    logs: state.logs,
    catalogRev: state.catalogRev,
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
  let dirty = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = normalizePersisted(JSON.parse(raw))
      if (!parsed) {
        persisted = createSeed(now)
        dirty = true
      } else {
        persisted = withCatalogDecks(parsed, now)
        dirty = persisted !== parsed
      }
    }
  } catch {
    persisted = createSeed(now)
    dirty = true
  }
  if (dirty) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    } catch {
      /* ignore quota */
    }
  }
  return { ...persisted, ready: true, session: readSession(), clock: now }
}

export function ensure() {
  if (loaded || typeof window === "undefined") return
  runtime = loadFromDisk()
  loaded = true
}

function getSnapshot() {
  return runtime
}

export function hydrateStore() {
  if (typeof window === "undefined" || loaded) return
  runtime = loadFromDisk()
  loaded = true
  listeners.forEach((listener) => listener())
}

function getServerSnapshot() {
  return SERVER_STATE
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function commit(next: Runtime, options?: { persist?: boolean; session?: boolean }) {
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

export function bumpClock() {
  if (!loaded) return
  runtime = { ...runtime, clock: Date.now() }
  listeners.forEach((listener) => listener())
}
