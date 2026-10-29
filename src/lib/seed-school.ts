import { mockPack } from "@/lib/school/mock"
import { l1Pack } from "@/lib/school/l1"
import { l2Pack } from "@/lib/school/l2"
import { l3Pack } from "@/lib/school/l3"
import { l4Pack } from "@/lib/school/l4"
import { slPack } from "@/lib/school/sl"
import type { SchoolPack } from "@/lib/school/types"

export type { SchoolPack }

export const CATALOG_DECK_IDS = [
  "d-ne-l1",
  "d-ne-l2",
  "d-ne-l3",
  "d-ne-l4",
  "d-ne-sl",
  "d-mock",
] as const

export const schoolPacks: SchoolPack[] = [l1Pack, l2Pack, l3Pack, l4Pack, slPack, mockPack]
