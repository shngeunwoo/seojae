"use client"

import { Suspense, useEffect, type ReactNode } from "react"
import { Toaster } from "sonner"
import { CircleCheckIcon, InfoIcon, OctagonXIcon, TriangleAlertIcon } from "lucide-react"
import { Mark } from "@/components/bits"
import { Shell } from "@/components/shell"
import { TooltipProvider } from "@/components/ui/tooltip"
import { bumpClock, flushPersist, flushStudyTime, useAppState } from "@/lib/store"

export function AppProvider({ children }: { children: ReactNode }) {
  const state = useAppState()

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () => {
      const dark =
        state.settings.theme === "dark" || (state.settings.theme === "system" && media.matches)
      root.classList.toggle("dark", dark)
      root.style.colorScheme = dark ? "dark" : "light"
      root.lang = state.settings.uiLang === "en" ? "en" : "ko"
    }
    apply()
    media.addEventListener("change", apply)
    const clock = window.setInterval(() => bumpClock(), 60_000)
    const hide = () => {
      flushStudyTime()
      flushPersist()
    }
    window.addEventListener("pagehide", hide)
    return () => {
      media.removeEventListener("change", apply)
      window.clearInterval(clock)
      window.removeEventListener("pagehide", hide)
    }
  }, [state.settings.theme, state.settings.uiLang, state.ready])

  const resolved =
    !state.ready || state.settings.theme === "system"
      ? "system"
      : state.settings.theme

  return (
    <TooltipProvider delay={400}>
      {state.ready ? null : (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <Mark className="size-12 text-primary" />
            <p className="text-lg font-medium tracking-tight">서재</p>
          </div>
        </div>
      )}
      <div inert={state.ready ? undefined : true} aria-hidden={state.ready ? undefined : true}>
        <Suspense>
          <Shell>{children}</Shell>
        </Suspense>
      </div>
      <Toaster
        theme={resolved}
        position="top-center"
        icons={{
          success: <CircleCheckIcon className="size-4" />,
          info: <InfoIcon className="size-4" />,
          warning: <TriangleAlertIcon className="size-4" />,
          error: <OctagonXIcon className="size-4" />,
        }}
      />
    </TooltipProvider>
  )
}
