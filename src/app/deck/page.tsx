"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DeckView } from "@/components/deck-view"

function DeckPage() {
  const params = useSearchParams()
  return <DeckView deckId={params.get("id") ?? ""} />
}

export default function Page() {
  return (
    <Suspense>
      <DeckPage />
    </Suspense>
  )
}
