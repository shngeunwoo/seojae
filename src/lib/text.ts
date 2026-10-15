import type { CardDraft, Lang, PartOfSpeech } from "@/lib/types"

const HANGUL = /[ㄱ-ㅎㅏ-ㅣ가-힣]/

export function hasHangul(text: string) {
  return HANGUL.test(text)
}

export function detectLang(text: string): Lang {
  const hangul = text.match(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g)?.length ?? 0
  const latin = text.match(/[A-Za-z]/g)?.length ?? 0
  if (hangul === 0 && latin === 0) return "en"
  return hangul > latin ? "ko" : "en"
}

export function normalizeAnswer(value: string) {
  return value
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[“”„«»"']/g, "")
    .replace(/[.…!?;:]+$/g, "")
    .replace(/\s+/g, " ")
}

export function acceptedAnswers(answer: string) {
  const parts = answer
    .split(/\s*(?:\/|\||;)\s*/)
    .map(normalizeAnswer)
    .filter(Boolean)
  const full = normalizeAnswer(answer)
  if (full && !parts.includes(full)) parts.unshift(full)
  return parts
}

export function levenshtein(a: string, b: string) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const prev = new Array<number>(b.length + 1)
  const curr = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j]
  }
  return prev[b.length]
}

export type TypedGrade = "correct" | "close" | "wrong"

export function gradeTyped(input: string, answer: string): TypedGrade {
  const guess = normalizeAnswer(input)
  if (!guess) return "wrong"
  const accepted = acceptedAnswers(answer)
  if (accepted.some((item) => item === guess)) return "correct"
  const close = accepted.some((item) => {
    if (item.length < 4 || Math.abs(item.length - guess.length) > 1) return false
    return levenshtein(item, guess) === 1
  })
  return close ? "close" : "wrong"
}

export function parseTags(input: string) {
  const out: string[] = []
  const seen = new Set<string>()
  for (const part of input.split(/[,，、]/)) {
    const tag = part.trim().slice(0, 24)
    if (!tag) continue
    const key = tag.toLocaleLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(tag)
    if (out.length >= 8) break
  }
  return out
}

const POS_SET = new Set<PartOfSpeech>(["noun", "verb", "adj", "adv", "phrase", "other"])

export function coercePos(value: string | undefined): PartOfSpeech {
  const key = (value ?? "").trim().toLowerCase()
  if (POS_SET.has(key as PartOfSpeech)) return key as PartOfSpeech
  if (key.startsWith("n") || key.includes("명")) return "noun"
  if (key.startsWith("v") || key.includes("동")) return "verb"
  if (key.startsWith("adj") || key.includes("형")) return "adj"
  if (key.startsWith("adv") || key.includes("부")) return "adv"
  if (key.includes("구") || key.includes("phrase")) return "phrase"
  return "other"
}

export function parseBulk(text: string): CardDraft[] {
  const drafts: CardDraft[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    let parts: string[] | null = null
    if (line.includes("\t")) parts = line.split("\t")
    else if (/\s[-–—]\s/.test(line)) parts = line.split(/\s[-–—]\s/)
    else if (line.includes("|")) parts = line.split("|")
    else continue
    const term = parts[0]?.trim() ?? ""
    const meaning = parts[1]?.trim() ?? ""
    if (!term || !meaning) continue
    drafts.push({
      term: term.slice(0, 120),
      meaning: meaning.slice(0, 200),
      termLang: detectLang(term),
      meaningLang: detectLang(meaning),
      example: (parts[2] ?? "").trim().slice(0, 400),
      exampleMeaning: (parts[3] ?? "").trim().slice(0, 400),
      pos: coercePos(parts[4]),
      tags: parseTags(parts[5] ?? ""),
      notes: (parts[6] ?? "").trim().slice(0, 800),
      favorite: false,
    })
  }
  return drafts
}

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "")
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += ch
      continue
    }
    if (ch === '"') quoted = true
    else if (ch === ",") {
      row.push(cell)
      cell = ""
    } else if (ch === "\n") {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else if (ch !== "\r") cell += ch
  }
  if (cell.length || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((entry) => entry.some((value) => value.trim()))
}

const HEADER_MAP: Record<string, keyof CardDraft | "skip"> = {
  term: "term",
  word: "term",
  front: "term",
  단어: "term",
  meaning: "meaning",
  back: "meaning",
  definition: "meaning",
  뜻: "meaning",
  의미: "meaning",
  example: "example",
  예문: "example",
  examplemeaning: "exampleMeaning",
  exampletranslation: "exampleMeaning",
  예문뜻: "exampleMeaning",
  해석: "exampleMeaning",
  pos: "pos",
  part: "pos",
  품사: "pos",
  tags: "tags",
  tag: "tags",
  태그: "tags",
  notes: "notes",
  note: "notes",
  메모: "notes",
}

export function draftsFromCsv(input: string): CardDraft[] {
  const rows = parseCsv(input)
  if (rows.length === 0) return []
  const header = rows[0].map((cell) => cell.trim().toLowerCase().replace(/\s+/g, ""))
  const known = header.some((cell) => HEADER_MAP[cell])
  const start = known ? 1 : 0
  const indexOf = (key: keyof CardDraft) =>
    header.findIndex((cell) => HEADER_MAP[cell] === key)

  const drafts: CardDraft[] = []
  for (const row of rows.slice(start)) {
    const pick = (key: keyof CardDraft, fallback: number) => {
      const index = known ? indexOf(key) : fallback
      return index >= 0 ? (row[index] ?? "").trim() : ""
    }
    const term = pick("term", 0).slice(0, 120)
    const meaning = pick("meaning", 1).slice(0, 200)
    if (!term || !meaning) continue
    const posRaw = pick("pos", 4)
    drafts.push({
      term,
      meaning,
      termLang: detectLang(term),
      meaningLang: detectLang(meaning),
      example: pick("example", 2).slice(0, 400),
      exampleMeaning: pick("exampleMeaning", 3).slice(0, 400),
      pos: coercePos(posRaw),
      tags: parseTags(pick("tags", 5)),
      notes: pick("notes", 6).slice(0, 800),
      favorite: false,
    })
  }
  return drafts
}

export function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

export function shuffle<T>(list: readonly T[]): T[] {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = arr[i]
    arr[i] = arr[j]
    arr[j] = current
  }
  return arr
}
