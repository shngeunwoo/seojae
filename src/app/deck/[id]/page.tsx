"use client"

import { useParams } from "next/navigation"
import { DeckView } from "@/components/deck-view"

export default function Page() {
  const params = useParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  return <DeckView deckId={id} />
}
