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
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/lib/use-i18n"
import { addDeck, updateDeck } from "@/lib/store"
import { DECK_COLORS, type Deck, type DeckColor } from "@/lib/types"
import type { DictKey } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const colorKey: Record<DeckColor, DictKey> = {
  pine: "colorPine",
  clay: "colorClay",
  gold: "colorGold",
  plum: "colorPlum",
  sea: "colorSea",
  ink: "colorInk",
}

export function DeckDialog({
  open,
  onOpenChange,
  deck,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  deck?: Deck | null
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DeckForm
          key={deck?.id ?? "new"}
          deck={deck}
          onOpenChange={onOpenChange}
          t={t}
        />
      ) : null}
    </Dialog>
  )
}

function DeckForm({
  deck,
  onOpenChange,
  t,
}: {
  deck?: Deck | null
  onOpenChange: (open: boolean) => void
  t: ReturnType<typeof useI18n>["t"]
}) {
  const [name, setName] = useState(deck?.name ?? "")
  const [description, setDescription] = useState(deck?.description ?? "")
  const [color, setColor] = useState<DeckColor>(deck?.color ?? "pine")

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) return
    if (deck) updateDeck(deck.id, { name: trimmed, description, color })
    else {
      addDeck({ name: trimmed, description, color })
      toast(t("deckSaved"))
    }
    onOpenChange(false)
  }

  return (
    <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{deck ? t("rename") : t("newDeck")}</DialogTitle>
          <DialogDescription>{t("deckNameHint")}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="deck-name">{t("deckName")}</Label>
            <Input
              id="deck-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("deckNameHint")}
              maxLength={80}
              autoFocus
              className="h-10"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deck-description">{t("deckDescription")}</Label>
            <Textarea
              id="deck-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={180}
              className="min-h-20"
            />
          </div>
          <div className="grid gap-2">
            <Label>{t("deckColor")}</Label>
            <div className="flex flex-wrap gap-2">
              {DECK_COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  data-color={item}
                  aria-pressed={color === item}
                  onClick={() => setColor(item)}
                  className={cn(
                    "swatch inline-flex h-9 items-center gap-2 rounded-full px-3 text-xs font-medium text-white",
                    color === item && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                  )}
                >
                  {t(colorKey[item])}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="border-0 bg-transparent px-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {deck ? t("save") : t("create")}
            </Button>
          </DialogFooter>
        </form>
    </DialogContent>
  )
}
