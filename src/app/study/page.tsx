"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { StudyView } from "@/components/study/study-view"

function StudyPage() {
  const params = useSearchParams()
  return <StudyView deckId={params.get("id") ?? ""} />
}

export default function Page() {
  return (
    <Suspense>
      <StudyPage />
    </Suspense>
  )
}
