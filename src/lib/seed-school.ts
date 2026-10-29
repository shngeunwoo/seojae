export type SchoolPack = {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  color: "pine" | "clay" | "gold" | "plum" | "sea" | "ink"
  tags: string[]
  words: string[][]
}

export const CATALOG_DECK_IDS = [
  "d-ne-l1",
  "d-ne-l2",
  "d-ne-l3",
  "d-ne-l4",
  "d-ne-sl",
  "d-mock",
] as const

export const schoolPacks: SchoolPack[] = [
  {
    id: "d-ne-l1",
    name: "공통영어2 1과",
    nameEn: "Common English 2 L1",
    description: "능률 오선영 · Embrace Connections",
    descriptionEn: "Neungyul Oh Seon-young, Lesson 1",
    color: "sea",
    tags: ["공통영어2", "L1"],
    words: [
      ["unite", "연합하다", "verb", "Musicians from five countries united for one stage.", "다섯 나라의 연주자들이 한 무대에 연합했다."],
      ["impressive", "인상적인", "adj", "The first chorus was more impressive than I expected.", "첫 후렴이 생각보다 인상적이었다."],
      ["vitality", "활기", "noun", "The street market still had a quiet vitality at dusk.", "해질녘 시장에도 조용한 활기가 남아 있었다."],
      ["randomly", "무작위로", "adv", "Names were drawn randomly from a small box.", "이름은 작은 상자에서 무작위로 뽑혔다."],
      ["nationality", "국적", "noun", "The form asked for nationality, not hometown.", "서류는 고향이 아니라 국적을 물었다."],
      ["lyrics", "가사", "noun", "I learned the lyrics before I learned the chords.", "코드보다 가사를 먼저 외웠다."],
      ["virtual", "가상의", "adj", "They held a virtual rehearsal across three time zones.", "세 시간대에 걸쳐 가상 리허설을 했다."],
      ["to one's surprise", "놀랍게도", "phrase", "To our surprise, the quiet student wrote the best verse.", "놀랍게도 말수 적은 학생이 가장 좋은 가사를 썼다."],
      ["eagerly", "간절히", "adv", "The younger members waited eagerly for their turn.", "후배들은 자기 차례를 간절히 기다렸다."],
      ["encounter", "맞닥뜨리다", "verb", "Online, we still encounter delays and dropped lines.", "온라인에서도 지연과 끊김을 맞닥뜨린다."],
      ["convenient", "편리한", "adj", "A shared folder is convenient, but it is not the same as a room.", "공유 폴더는 편리하지만 한 방과는 다르다."],
      ["out of sync", "조화를 이루지 못하는", "phrase", "The drums were out of sync with the vocal.", "드럼이 보컬과 조화를 이루지 못했다."],
      ["devise", "고안하다", "verb", "They devised a simple cue so everyone could enter together.", "모두 같이 들어오도록 간단한 신호를 고안했다."],
      ["assemble", "모으다", "verb", "It took an hour to assemble the full group on one call.", "한 통화에 전원을 모으는 데 한 시간이 걸렸다."],
      ["when it comes to", "~에 관한 한", "phrase", "When it comes to harmony, listening matters more than volume.", "하모니에 관한 한 크기보다 듣기가 중요하다."],
      ["take turns", "교대로 하다", "phrase", "We take turns leading the warm-up.", "워밍업은 교대로 이끈다."],
      ["put on hold", "보류하다", "phrase", "Travel plans were put on hold until the visas arrived.", "비자가 올 때까지 여행 계획은 보류됐다."],
      ["interaction", "상호 작용", "noun", "Good interaction is hard when faces freeze on screen.", "화면이 멈추면 상호 작용이 어렵다."],
      ["hardship", "어려움", "noun", "Distance was a hardship, not a reason to stop.", "거리는 어려움이지 그만둘 이유는 아니었다."],
      ["in person", "직접", "phrase", "They finally sang in person after a year of screens.", "일 년의 화면 끝에 드디어 직접 노래했다."],
    ],
  },
  {
    id: "d-ne-l2",
    name: "공통영어2 2과",
    nameEn: "Common English 2 L2",
    description: "능률 오선영 · From Problems to Solutions",
    descriptionEn: "Neungyul Oh Seon-young, Lesson 2",
    color: "clay",
    tags: ["공통영어2", "L2"],
    words: [
      ["collaboration", "협력", "noun", "The park came from a collaboration between residents and the city.", "공원은 주민과 시의 협력에서 나왔다."],
      ["revitalize", "되살리다", "verb", "New shops helped revitalize the empty block.", "새 가게들이 빈 거리를 되살리는 데 도움이 됐다."],
      ["be known for", "~로 알려지다", "phrase", "The town is known for its old shipyard.", "그 마을은 오래된 조선소로 알려진다."],
      ["architecture", "건축", "noun", "The architecture still shows the port's busy years.", "건축이 항구가 붐비던 시절을 아직 보여 준다."],
      ["port", "항구", "noun", "Cranes still stand along the quiet port.", "조용한 항구를 따라 기중기가 아직 서 있다."],
      ["residential", "주거의", "adj", "A residential street does not need another warehouse.", "주거 거리에는 창고가 하나 더 필요 없다."],
      ["abandon", "버리다", "verb", "They refused to abandon the brick buildings.", "그들은 벽돌 건물을 버리기를 거부했다."],
      ["take over", "넘겨받다", "phrase", "A small studio will take over the ground floor.", "작은 작업실이 1층을 넘겨받는다."],
      ["tear down", "허물다", "phrase", "The easy plan was to tear down everything.", "손쉬운 계획은 전부 허무는 것이었다."],
      ["budget", "예산", "noun", "The budget was tight, so they reused the walls.", "예산이 빠듯해서 벽을 다시 썼다."],
      ["renovate", "고치다", "verb", "Volunteers helped renovate the old hall.", "자원봉사자들이 낡은 회관을 고치는 일을 도왔다."],
      ["applicant", "지원자", "noun", "Every applicant had to explain how the space would be used.", "모든 지원자는 공간을 어떻게 쓸지 설명해야 했다."],
      ["apparently", "보아하니", "adv", "Apparently the roof can last another decade.", "보아하니 지붕은 십 년은 더 간다."],
      ["transform", "바꾸다", "verb", "Light and plants can transform a grey courtyard.", "빛과 식물이 회색 마당을 바꿀 수 있다."],
      ["worn-out", "닳은", "adj", "Worn-out benches were repaired, not thrown away.", "닳은 벤치는 버리지 않고 고쳤다."],
      ["desirable", "바람직한", "adj", "A walkable street is a desirable change.", "걸어 다닐 수 있는 길은 바람직한 변화다."],
      ["shipyard", "조선소", "noun", "The shipyard once employed half the town.", "조선소는 한때 마을 절반을 고용했다."],
      ["turn to", "의지하다", "phrase", "When money ran short, they turned to local makers.", "돈이 모자라자 동네 제작자에게 의지했다."],
      ["primary", "주된", "adj", "The primary goal was safety, then beauty.", "주된 목표는 안전이었고, 그다음이 아름다움이었다."],
      ["innovative", "혁신적인", "adj", "An innovative lease let artists pay with upkeep.", "혁신적인 임대는 예술가가 관리로 값을 치르게 했다."],
      ["award", "수여하다", "verb", "The city will award the unused lot to a community kitchen.", "시는 빈 땅을 공동체 부엌에 수여할 것이다."],
      ["lease", "임대 계약", "noun", "The lease lasts five years if the garden stays open.", "정원이 열려 있으면 임대는 오 년이다."],
      ["foundation", "토대", "noun", "A dry foundation matters more than new paint.", "새 페인트보다 마른 토대가 더 중요하다."],
      ["upcycle", "업사이클하다", "verb", "Students upcycled crates into seats.", "학생들은 상자를 의자로 업사이클했다."],
      ["path", "길", "noun", "A gravel path now links the station to the river.", "자갈길이 이제 역과 강을 잇는다."],
      ["purify", "정화하다", "verb", "Reeds help purify the small canal.", "갈대가 작은 운하를 정화하는 데 도움이 된다."],
      ["cooperation", "협동", "noun", "Without cooperation the lights would stay off.", "협동 없이는 불이 꺼진 채로 남았을 것이다."],
      ["vital", "필수적인", "adj", "Shade is vital in a treeless lot.", "나무 없는 공터에서 그늘은 필수적이다."],
      ["inspiration", "영감", "noun", "The old crane became an inspiration, not scrap.", "낡은 기중기는 고철이 아니라 영감이 됐다."],
    ],
  },
]