export const DECK_COLORS = ["pine", "clay", "gold", "plum", "sea", "ink"] as const
export type DeckColor = (typeof DECK_COLORS)[number]

export const PARTS = ["noun", "verb", "adj", "adv", "phrase", "other"] as const
export type PartOfSpeech = (typeof PARTS)[number]

export const STUDY_MODES = ["flash", "quiz", "type", "listen", "match"] as const
export type StudyMode = (typeof STUDY_MODES)[number]

export const DIRECTIONS = ["forward", "reverse", "mix"] as const
export type Direction = (typeof DIRECTIONS)[number]

export const SCOPES = ["today", "new", "weak", "starred", "all"] as const
export type Scope = (typeof SCOPES)[number]

export type Lang = "ko" | "en"
export type ThemeMode = "light" | "dark" | "system"
export type Grade = 0 | 1 | 2 | 3
export type Mastery = "new" | "learning" | "review" | "mastered"

export type Card = {
  id: string
  deckId: string
  term: string
  meaning: string
  termLang: Lang
  meaningLang: Lang
  example: string
  exampleMeaning: string
  pos: PartOfSpeech
  tags: string[]
  notes: string
  favorite: boolean
  createdAt: number
  updatedAt: number
  ease: number
  interval: number
  repetitions: number
  due: number
  lapses: number
  reviews: number
  correct: number
  lastReviewed: number | null
}

export type CardDraft = {
  term: string
  meaning: string
  termLang: Lang
  meaningLang: Lang
  example: string
  exampleMeaning: string
  pos: PartOfSpeech
  tags: string[]
  notes: string
  favorite: boolean
}

export type Deck = {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  color: DeckColor
  createdAt: number
  updatedAt: number
}

export type Settings = {
  uiLang: Lang
  theme: ThemeMode
  dailyGoal: number
  tts: boolean
  ttsRate: number
  autoSpeak: boolean
  showExample: boolean
}

export type DayLog = {
  reviews: number
  correct: number
  seconds: number
}

export type Persisted = {
  version: 1
  decks: Deck[]
  cards: Card[]
  settings: Settings
  logs: Record<string, DayLog>
}

export type Session = {
  deckId: string
  mode: StudyMode
  direction: Direction
  scope: Scope
  cardIds: string[]
  index: number
  phase: "run" | "summary"
  correct: number
  wrong: number
  missedIds: string[]
  startedAt: number
  lastTick: number
  hints: number
  paused: boolean
  activeSeconds: number
}

export type Runtime = Persisted & {
  ready: boolean
  session: Session | null
  clock: number
}

export const LIMITS = [10, 20, 40, 0] as const
