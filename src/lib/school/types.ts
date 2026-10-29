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
