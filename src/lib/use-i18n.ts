"use client"

import { useCallback } from "react"
import { translate, type DictKey } from "@/lib/i18n"
import { useAppState } from "@/lib/store"

export function useI18n() {
  const lang = useAppState().settings.uiLang
  const t = useCallback(
    (key: DictKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  )
  return { lang, t }
}
