"use client"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-medium">화면을 열지 못했어요</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">잠시 후 다시 시도해 주세요.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 h-10 rounded-xl bg-primary px-4 text-sm text-primary-foreground"
      >
        다시 시도
      </button>
    </div>
  )
}
