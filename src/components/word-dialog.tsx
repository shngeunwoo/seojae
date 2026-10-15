"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { DictKey } from "@/lib/i18n"
import { addCard, hasDuplicate, updateCard } from "@/lib/store"
import { detectLang, parseTags } from "@/lib/text"
import type { Card, CardDraft, Lang, PartOfSpeech } from "@/lib/types"
import { PARTS } from "@/lib/types"
import { useI18n } from "@/lib/use-i18n"
import { cn } from "@/lib/utils"

const posKey: Record<PartOfSpeech, DictKey> = {
  noun: "posNoun",
  verb: "posVerb",
  adj: "posAdj",
  adv: "posAdv",
  phrase: "posPhrase",
  other: "posOther",
}

const empty = (): CardDraft => ({
  term: "",
  meaning: "",
  termLang: "en",
  meaningLang: "ko",
  example: "",
  exampleMeaning: "",
  pos: "noun",
  tags: [],
  notes: "",
  favorite: false,
})

export function WordDialog({
  open,
  onOpenChange,
  deckId,
  card,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  deckId: string
  card?: Card | null
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <WordForm
          key={card?.id ?? "new"}
          deckId={deckId}
          card={card}
          onOpenChange={onOpenChange}
          t={t}
        />
      ) : null}
    </Dialog>
  )
}

function WordForm({
  deckId,
  card,
  onOpenChange,
  t,
}: {
  deckId: string
  card?: Card | null
  onOpenChange: (open: boolean) => void
  t: ReturnType<typeof useI18n>["t"]
}) {
  const [draft, setDraft] = useState<CardDraft>(() =>
    card
      ? {
          term: card.term,
          meaning: card.meaning,
          termLang: card.termLang,
          meaningLang: card.meaningLang,
          example: card.example,
          exampleMeaning: card.exampleMeaning,
          pos: card.pos,
          tags: card.tags,
          notes: card.notes,
          favorite: card.favorite,
        }
      : empty(),
  )
  const [tagText, setTagText] = useState(card?.tags.join(", ") ?? "")
  const [error, setError] = useState<"" | "required" | "duplicate">("")
  const [allowDupe, setAllowDupe] = useState(false)
  const [lockTerm, setLockTerm] = useState(false)
  const [lockMeaning, setLockMeaning] = useState(false)

  function patch(partial: Partial<CardDraft>) {
    setDraft((current) => ({ ...current, ...partial }))
    setError("")
  }

  function save(another: boolean) {
    const term = draft.term.trim()
    const meaning = draft.meaning.trim()
    if (!term || !meaning) {
      setError("required")
      return
    }
    if (!allowDupe && hasDuplicate(deckId, term, card?.id)) {
      setAllowDupe(true)
      setError("duplicate")
      return
    }
    const next: CardDraft = { ...draft, term, meaning, tags: parseTags(tagText) }
    if (card) updateCard(card.id, next)
    else addCard(deckId, next)
    toast(t("savedWord"))
    if (another && !card) {
      setDraft(empty())
      setTagText("")
      setAllowDupe(false)
      setError("")
      return
    }
    onOpenChange(false)
  }

  return (
    <DialogContent className="max-h-[min(92dvh,760px)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{card ? t("editWord") : t("newWord")}</DialogTitle>
          <DialogDescription>{t("meaningHint")}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            save(false)
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="word-term"
              label={t("term")}
              hint={t("termHint")}
              value={draft.term}
              lang={draft.termLang}
              onLang={() => {
                setLockTerm(true)
                patch({ termLang: draft.termLang === "en" ? "ko" : "en" })
              }}
              onChange={(value) => {
                patch({
                  term: value,
                  termLang: lockTerm ? draft.termLang : detectLang(value),
                })
                setAllowDupe(false)
              }}
              autoFocus
            />
            <Field
              id="word-meaning"
              label={t("meaning")}
              hint={t("meaningHint")}
              value={draft.meaning}
              lang={draft.meaningLang}
              onLang={() => {
                setLockMeaning(true)
                patch({ meaningLang: draft.meaningLang === "en" ? "ko" : "en" })
              }}
              onChange={(value) =>
                patch({
                  meaning: value,
                  meaningLang: lockMeaning ? draft.meaningLang : detectLang(value),
                })
              }
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {t(error)}
            </p>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="word-pos">{t("pos")}</Label>
            <Select
              value={draft.pos}
              onValueChange={(value) => {
                if (value) patch({ pos: value as PartOfSpeech })
              }}
            >
              <SelectTrigger id="word-pos" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTS.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {t(posKey[pos])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="word-example">{t("example")}</Label>
              <Textarea
                id="word-example"
                value={draft.example}
                placeholder={t("exampleHint")}
                maxLength={400}
                onChange={(event) => patch({ example: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="word-example-meaning">{t("exampleMeaning")}</Label>
              <Textarea
                id="word-example-meaning"
                value={draft.exampleMeaning}
                maxLength={400}
                onChange={(event) => patch({ exampleMeaning: event.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="word-tags">{t("tags")}</Label>
            <Input
              id="word-tags"
              value={tagText}
              placeholder={t("tagsHint")}
              className="h-10"
              onChange={(event) => setTagText(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="word-notes">{t("notes")}</Label>
            <Textarea
              id="word-notes"
              value={draft.notes}
              placeholder={t("notesHint")}
              maxLength={800}
              onChange={(event) => patch({ notes: event.target.value })}
            />
          </div>
          <label className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
            <span className="text-sm">{t("favorite")}</span>
            <Switch
              checked={draft.favorite}
              onCheckedChange={(checked) => patch({ favorite: Boolean(checked) })}
            />
          </label>
          <DialogFooter className="border-0 bg-transparent px-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            {card ? null : (
              <Button type="button" variant="secondary" onClick={() => save(true)}>
                {t("saveNext")}
              </Button>
            )}
            <Button type="submit">{t("save")}</Button>
          </DialogFooter>
        </form>
    </DialogContent>
  )
}

function Field({
  id,
  label,
  hint,
  value,
  lang,
  onChange,
  onLang,
  autoFocus,
}: {
  id: string
  label: string
  hint: string
  value: string
  lang: Lang
  onChange: (value: string) => void
  onLang: () => void
  autoFocus?: boolean
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <button
          type="button"
          onClick={onLang}
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide",
            lang === "ko" ? "border-primary/40 text-primary" : "text-muted-foreground",
          )}
        >
          {lang === "ko" ? "KO" : "EN"}
        </button>
      </div>
      <Input
        id={id}
        value={value}
        placeholder={hint}
        maxLength={id === "word-term" ? 120 : 200}
        autoFocus={autoFocus}
        className="h-10"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

export { posKey }
