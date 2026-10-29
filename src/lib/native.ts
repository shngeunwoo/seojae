"use client"

type ThemeMode = "light" | "dark" | "system"

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean
  }
}

export function isNativeApp() {
  if (typeof window === "undefined") return false
  return Boolean((window as CapacitorWindow).Capacitor?.isNativePlatform?.())
}

export async function bootNativeShell(theme: ThemeMode) {
  if (!isNativeApp()) return
  const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([
    import("@capacitor/status-bar"),
    import("@capacitor/splash-screen"),
  ])
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  await StatusBar.setOverlaysWebView({ overlay: false })
  await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light })
  await StatusBar.setBackgroundColor({ color: dark ? "#141714" : "#f3efe6" })
  await SplashScreen.hide()
}

export function watchNativeBack() {
  if (!isNativeApp()) return () => {}
  let removed = false
  let handle: { remove: () => Promise<void> } | null = null
  void import("@capacitor/app").then(({ App }) => {
    if (removed) return
    void App.addListener("backButton", () => {
      const path = window.location.pathname.replace(/\/$/, "") || "/"
      if (path === "/" && !window.location.search) {
        void App.exitApp()
        return
      }
      if (window.history.length > 1) {
        window.history.back()
        return
      }
      window.location.assign("/")
    }).then((listener) => {
      if (removed) {
        void listener.remove()
        return
      }
      handle = listener
    })
  })
  return () => {
    removed = true
    void handle?.remove()
  }
}

export async function shareTextFile(filename: string, text: string) {
  const { Directory, Encoding, Filesystem } = await import("@capacitor/filesystem")
  const { Share } = await import("@capacitor/share")
  const safe = filename.replace(/[^\w.\-가-힣]/g, "_")
  const result = await Filesystem.writeFile({
    path: safe,
    data: text,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  })
  await Share.share({
    title: filename,
    url: result.uri,
    dialogTitle: filename,
  })
}
