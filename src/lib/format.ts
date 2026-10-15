import type { Lang } from "@/lib/types"

export function dayKey(ts: number) {
  const date = new Date(ts)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function shiftDay(key: string, delta: number) {
  const [y, m, d] = key.split("-").map(Number)
  const date = new Date(y, (m || 1) - 1, d || 1)
  date.setDate(date.getDate() + delta)
  return dayKey(date.getTime())
}

export function formatDate(ts: number, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(ts))
}

export function formatSpan(days: number, lang: Lang) {
  if (days < 1) {
    const minutes = Math.max(1, Math.round(days * 24 * 60))
    if (minutes < 90) return lang === "ko" ? `${minutes}분` : `${minutes}m`
    const hours = Math.max(1, Math.round(minutes / 60))
    return lang === "ko" ? `${hours}시간` : `${hours}h`
  }
  if (days < 30) {
    const rounded = Math.max(1, Math.round(days))
    return lang === "ko" ? `${rounded}일` : `${rounded}d`
  }
  if (days < 365) {
    const months = Math.max(1, Math.round(days / 30))
    return lang === "ko" ? `${months}개월` : `${months}mo`
  }
  const years = Math.max(1, Math.round(days / 365))
  return lang === "ko" ? `${years}년` : `${years}y`
}

export function formatAhead(ms: number, lang: Lang) {
  if (ms <= 0) return lang === "ko" ? "오늘" : "Today"
  const label = formatSpan(ms / 86_400_000, lang)
  return lang === "ko" ? `${label} 후` : `in ${label}`
}

export function formatMinutes(seconds: number, lang: Lang) {
  const minutes = Math.max(0, Math.round(seconds / 60))
  if (minutes < 1) return lang === "ko" ? "1분 미만" : "<1m"
  if (minutes < 60) return lang === "ko" ? `${minutes}분` : `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (rest === 0) return lang === "ko" ? `${hours}시간` : `${hours}h`
  return lang === "ko" ? `${hours}시간 ${rest}분` : `${hours}h ${rest}m`
}

export function percent(value: number) {
  return `${Math.round(value * 100)}%`
}
