"use client"

import { useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { draftsFromCsv } from "@/lib/text"
import {
  addDeck,
  addDrafts,
  downloadText,
  exportJson,
  mergeLibrary,
  normalizePersisted,
  replaceLibrary,
  restoreSample,
  updateSettings,
  useAppState,
  wipeLibrary,
} from "@/lib/store"
import type { ThemeMode } from "@/lib/types"
import { useI18n } from "@/lib/use-i18n"
import { cn } from "@/lib/utils"

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const state = useAppState()
  const { lang, t } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<ReturnType<typeof normalizePersisted>>(null)
  const [confirm, setConfirm] = useState<"sample" | "wipe" | null>(null)
  const settings = state.settings

  function onFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? "")
      const trimmed = text.trim()
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          const parsed = normalizePersisted(JSON.parse(trimmed))
          if (!parsed) {
            toast.error(t("importInvalid"))
            return
          }
          setPending(parsed)
        } catch {
          toast.error(t("importInvalid"))
        }
        return
      }
      const drafts = draftsFromCsv(text)
      if (!drafts.length) {
        toast.error(t("importInvalid"))
        return
      }
      const deck = addDeck({
        name: lang === "ko" ? "가져온 단어" : "Imported",
        description: "",
        color: "sea",
      })
      addDrafts(deck.id, drafts)
      toast(t("importCsv", { n: drafts.length }))
    }
    reader.readAsText(file)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[min(92dvh,820px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("settingsTitle")}</DialogTitle>
            <DialogDescription>{t("aboutBody")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6">
            <section className="grid gap-3">
              <Label>{t("language")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Choice
                  pressed={settings.uiLang === "ko"}
                  onClick={() => updateSettings({ uiLang: "ko" })}
                >
                  한국어
                </Choice>
                <Choice
                  pressed={settings.uiLang === "en"}
                  onClick={() => updateSettings({ uiLang: "en" })}
                >
                  English
                </Choice>
              </div>
            </section>
            <section className="grid gap-3">
              <Label>{t("theme")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["light", "dark", "system"] as ThemeMode[]).map((theme) => (
                  <Choice
                    key={theme}
                    pressed={settings.theme === theme}
                    onClick={() => updateSettings({ theme })}
                  >
                    {t(theme === "light" ? "themeLight" : theme === "dark" ? "themeDark" : "themeSystem")}
                  </Choice>
                ))}
              </div>
            </section>
            <section className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="goal">{t("goal")}</Label>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {t("goalHint", { n: settings.dailyGoal })}
                </span>
              </div>
              <input
                id="goal"
                type="range"
                min={5}
                max={100}
                step={5}
                value={settings.dailyGoal}
                onChange={(event) => updateSettings({ dailyGoal: Number(event.target.value) })}
                className="accent-primary"
              />
            </section>
            <section className="grid gap-3">
              <Label>{t("speech")}</Label>
              <Toggle
                label={t("speechOn")}
                checked={settings.tts}
                onChange={(tts) => updateSettings({ tts })}
              />
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="rate">{t("speechRate")}</Label>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {settings.ttsRate.toFixed(2)}
                </span>
              </div>
              <input
                id="rate"
                type="range"
                min={0.75}
                max={1.25}
                step={0.05}
                value={settings.ttsRate}
                disabled={!settings.tts}
                onChange={(event) => updateSettings({ ttsRate: Number(event.target.value) })}
                className="accent-primary disabled:opacity-40"
              />
              <Toggle
                label={t("autoSpeak")}
                checked={settings.autoSpeak}
                onChange={(autoSpeak) => updateSettings({ autoSpeak })}
              />
              <Toggle
                label={t("showExample")}
                checked={settings.showExample}
                onChange={(showExample) => updateSettings({ showExample })}
              />
            </section>
            <section className="grid gap-3">
              <Label>{t("data")}</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const stamp = new Date().toISOString().slice(0, 10)
                    downloadText(`seojae-${stamp}.json`, exportJson(), "application/json")
                  }}
                >
                  {t("exportJson")}
                </Button>
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  {t("importFile")}
                </Button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,text/csv,.json,.csv,text/plain"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ""
                  if (file) onFile(file)
                }}
              />
              <Button type="button" variant="outline" onClick={() => setConfirm("sample")}>
                {t("resetSample")}
              </Button>
              <Button type="button" variant="destructive" onClick={() => setConfirm("wipe")}>
                {t("wipe")}
              </Button>
              <p className="text-xs leading-5 text-muted-foreground">{t("about")}. {t("aboutBody")}</p>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pending)} onOpenChange={(next) => !next && setPending(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("importTitle")}</DialogTitle>
            <DialogDescription>
              {t("importBody", {
                decks: pending?.decks.length ?? 0,
                cards: pending?.cards.length ?? 0,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button
              type="button"
              onClick={() => {
                if (!pending) return
                replaceLibrary(pending)
                setPending(null)
                toast(t("importDone"))
              }}
            >
              {t("importReplace")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!pending) return
                mergeLibrary(pending)
                setPending(null)
                toast(t("importDone"))
              }}
            >
              {t("importMerge")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm === "sample"}
        onOpenChange={(next) => !next && setConfirm(null)}
        title={t("resetSample")}
        description={t("resetSampleBody")}
        confirmLabel={t("resetSample")}
        cancelLabel={t("cancel")}
        destructive
        onConfirm={() => {
          restoreSample()
          toast(t("resetDone"))
        }}
      />
      <ConfirmDialog
        open={confirm === "wipe"}
        onOpenChange={(next) => !next && setConfirm(null)}
        title={t("wipe")}
        description={t("wipeBody")}
        confirmLabel={t("wipe")}
        cancelLabel={t("cancel")}
        destructive
        onConfirm={() => {
          wipeLibrary()
          toast(t("wiped"))
        }}
      />
    </>
  )
}

function Choice({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "h-10 rounded-xl border text-sm transition",
        pressed ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
      <span className="text-sm leading-5">{label}</span>
      <Switch checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} />
    </label>
  )
}
