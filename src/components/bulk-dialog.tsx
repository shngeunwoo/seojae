"use client"

import { useMemo, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { addDrafts } from "@/lib/store"
import { parseBulk } from "@/lib/text"
import { useI18n } from "@/lib/use-i18n"

export function BulkDialog({
  open,
  onOpenChange,
  deckId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  deckId: string
}) {
  const { t } = useI18n()
  const [text, setText] = useState("")
  const drafts = useMemo(() => parseBulk(text), [text])

  function submit() {
    if (!drafts.length) return
    const result = addDrafts(deckId, drafts)
    const message = [t("bulkAdded", result)]
    if (result.skipped) message.push(t("bulkSkipped", { n: result.skipped }))
    toast(message.join(" · "))
    setText("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("bulkTitle")}</DialogTitle>
          <DialogDescription>{t("bulkBody")}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("bulkPlaceholder")}
          className="min-h-48 font-mono text-[13px] leading-6"
        />
        <p className="text-sm text-muted-foreground">
          {drafts.length ? t("bulkPreview", { n: drafts.length }) : t("bulkNone")}
        </p>
        <DialogFooter className="border-0 bg-transparent px-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" disabled={!drafts.length} onClick={submit}>
            {t("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
