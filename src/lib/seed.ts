import { detectLang } from "@/lib/text"
import type { Card, CardDraft, Deck, DeckColor, PartOfSpeech, Persisted } from "@/lib/types"
import { defaultSettings } from "@/lib/settings"

type SeedWord = {
  id: string
  term: string
  meaning: string
  pos: PartOfSpeech
  example: string
  exampleMeaning: string
  tags: string[]
}

type SeedDeck = {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  color: DeckColor
  tags: string[]
  words: SeedWord[]
}

const decks: SeedDeck[] = [
  {
    id: "d-daily",
    name: "하루의 말",
    nameEn: "Words for a day",
    description: "집과 골목에서 바로 쓰는 표현",
    descriptionEn: "Phrases for home, weather, and small errands",
    color: "pine",
    tags: ["daily"],
    words: [
      ["linger", "한참 머물다", "verb", "I lingered by the window until the rain stopped.", "비가 그칠 때까지 창가에 한참 머물렀다."],
      ["drizzle", "이슬비", "noun", "A light drizzle started on the way home.", "집에 가는 길에 이슬비가 내리기 시작했다."],
      ["cozy", "아능한", "adj", "The small bookstore felt cozy in the evening.", "작은 서점은 저녁에 아능했다."],
      ["spare", "할애하다", "verb", "Can you spare ten minutes after lunch?", "점심 후에 10분만 내줄 수 있어요?"],
      ["glance", "흘긓 보다", "verb", "She glanced at the clock and stood up.", "그녀는 시계를 흘긓 보고 일어났다."],
      ["craving", "갈망", "noun", "I had a craving for something warm.", "따뜻한 것이 참을 수 없이 당겼다."],
      ["postpone", "미루다", "verb", "We postponed the walk until the wind died down.", "바람이 잠아들 때까지 산책을 미륯c다."],
      ["borrow", "빌리다", "verb", "May I borrow your pen for a second?", "펜 잠깐 빌려도 될까요?"],
      ["remind", "상기시키다", "verb", "Remind me to water the plants tonight.", "오늘 밤 화분에 물 주는 것 좀 알려 줘."],
      ["tidy", "정돈하다", "verb", "I tidied the desk before opening the book.", "책을 펴기 전에 책상을 정돈했다."],
      ["stroll", "산책하다", "verb", "We strolled along the river after dinner.", "저녁을 먹고 강을 따라 산책했다."],
      ["whisper", "속삭이다", "verb", "He whispered so the baby would stay asleep.", "아기가 계속 자도록 그가 속삭였다."],
    ].map(toWord),
  },
  {
    id: "d-work",
    name: "일의 말",
    nameEn: "Words for work",
    description: "회의와 메일에서 자주 만나는 단어",
    descriptionEn: "Words that show up in meetings and mail",
    color: "clay",
    tags: ["work"],
    words: [
      ["deadline", "마감", "noun", "The deadline is Thursday at noon.", "마감은 목요일 정오예요."],
      ["negotiate", "협상하다", "verb", "We negotiated a calmer schedule.", "더 여유 있는 일정으로 협상했다."],
      ["agenda", "안건", "noun", "Let us keep the agenda to three items.", "안건은 세 가지로만 두죠."],
      ["consensus", "합의", "noun", "The team reached a quiet consensus.", "팀은 조용히 합의에 이르렀다."],
      ["allocate", "배분하다", "verb", "Allocate an hour for review.", "검토에 한 시간을 배분해 두세요."],
      ["feasible", "실현 가능한", "adj", "The plan is ambitious, but feasible.", "계획은 야심 차지만 실현 가능해요."],
      ["clarify", "분명히 하다", "verb", "Could you clarify the last point?", "마지막 부분을 분명히 해 주실래요?"],
      ["stakeholder", "이해관계자", "noun", "Send the note to every stakeholder.", "메모를 모든 이해관계자에게 보내세요."],
      ["bottleneck", "병목", "noun", "Approvals are still the bottleneck.", "승인 절차가 아직도 병목이에요."],
      ["estimate", "추정하다", "verb", "We estimate two weeks of work.", "작업은 2주 정도로 추정해요."],
      ["prioritize", "우선순위를 정하다", "verb", "Prioritize the tasks that unblock others.", "다른 일을 막고 있는 것부터 우선순위를 정하세요."],
      ["follow up", "후속 조치를 하다", "phrase", "I will follow up with a short summary.", "짧은 요약으로 후속 조치를 할게요."],
    ].map(toWord),
  },
  {
    id: "d-heart",
    name: "마음의 말",
    nameEn: "Words for feeling",
    description: "기분을 정확하게 말하는 형용사",
    descriptionEn: "Adjectives for saying how you actually feel",
    color: "plum",
    tags: ["feeling"],
    words: [
      ["relieved", "안도하는", "adj", "I felt relieved after the call.", "통화를 마치고 안도했다."],
      ["uneasy", "편치 않은", "adj", "The long silence made me uneasy.", "긴 침묵이 마음을 편치 않게 했다."],
      ["grateful", "고마운", "adj", "I am grateful you stayed a little longer.", "조금 더 남아 줘서 고마워요."],
      ["overwhelmed", "벅찬", "adj", "The good news left me overwhelmed.", "좋은 소식인데도 마음이 벅찬다."],
      ["nostalgic", "그리운", "adj", "That song made the evening nostalgic.", "그 노래 때문에 저녁이 그리워졌다."],
      ["indifferent", "무관심한", "adj", "He seemed indifferent to the result.", "그는 결과에 무관심해 보였다."],
      ["hopeful", "희망에 찬", "adj", "The morning felt quietly hopeful.", "아침이 조용히 희망적으로 느꺼졌다."],
      ["frustrated", "답답한", "adj", "I get frustrated when the steps are unclear.", "순서가 불분명하면 답답해져요."],
      ["content", "만족스러운", "adj", "A quiet hour is enough to feel content.", "조용한 한 시간이면 충분히 만족스러워요."],
      ["anxious", "초조한", "adj", "I was anxious before the first sentence.", "첫 문장을 내기 전에 초조했다."],
      ["bitter", "쓰쓸한", "adj", "The ending tasted a little bitter.", "결말이 조금 쓰쓸했다."],
      ["tender", "다정한", "adj", "She left a tender note on the desk.", "그녀는 책상 위에 다정한 쪽지를 남겼다."],
    ].map(toWord),
  },
]

function toWord(row: string[]): SeedWord {
  const [term, meaning, pos, example, exampleMeaning] = row
  return {
    id: `c-${term.replace(/\s+/g, "-")}`,
    term,
    meaning,
    pos: pos as PartOfSpeech,
    example,
    exampleMeaning,
    tags: [],
  }
}

export function createSeed(now: number): Persisted {
  const deckRows: Deck[] = decks.map((deck) => ({
    id: deck.id,
    name: deck.name,
    nameEn: deck.nameEn,
    description: deck.description,
    descriptionEn: deck.descriptionEn,
    color: deck.color,
    createdAt: now,
    updatedAt: now,
  }))
  const cards: Card[] = decks.flatMap((deck) =>
    deck.words.map((word, index) => {
      const draft: CardDraft = {
        term: word.term,
        meaning: word.meaning,
        termLang: detectLang(word.term),
        meaningLang: detectLang(word.meaning),
        example: word.example,
        exampleMeaning: word.exampleMeaning,
        pos: word.pos,
        tags: deck.tags,
        notes: "",
        favorite: false,
      }
      return {
        ...draft,
        id: word.id,
        deckId: deck.id,
        createdAt: now + index,
        updatedAt: now + index,
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        due: now,
        lapses: 0,
        reviews: 0,
        correct: 0,
        lastReviewed: null,
      }
    }),
  )
  return {
    version: 1,
    decks: deckRows,
    cards,
    settings: defaultSettings,
    logs: {},
  }
}
