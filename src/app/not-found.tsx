import Link from "next/link"

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-medium">없는 페이지예요</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">주소가 바뀌었거나 지워진 화면이에요.</p>
      <Link href="/" className="mt-6 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm text-primary-foreground">
        오늘로
      </Link>
    </div>
  )
}
