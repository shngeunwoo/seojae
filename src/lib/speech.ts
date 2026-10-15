import { hasHangul } from "@/lib/text"

let voicesReady: Promise<void> | null = null

function voices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return []
  return window.speechSynthesis.getVoices()
}

function ensureVoices() {
  if (voices().length || typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve()
  }
  if (!voicesReady) {
    voicesReady = new Promise((resolve) => {
      const synth = window.speechSynthesis
      const done = () => {
        synth.removeEventListener("voiceschanged", done)
        resolve()
      }
      synth.addEventListener("voiceschanged", done)
      window.setTimeout(done, 700)
    })
  }
  return voicesReady
}

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window
}

export async function speak(text: string, rate = 1) {
  if (!canSpeak() || !text.trim()) return
  await ensureVoices()
  const synth = window.speechSynthesis
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  const korean = hasHangul(text)
  const prefix = korean ? "ko" : "en"
  utterance.lang = korean ? "ko-KR" : "en-US"
  utterance.rate = Math.min(1.3, Math.max(0.7, rate))
  const list = voices()
  const voice =
    list.find((item) => item.lang.toLowerCase().startsWith(prefix) && item.localService) ??
    list.find((item) => item.lang.toLowerCase().startsWith(prefix))
  if (voice) utterance.voice = voice
  synth.speak(utterance)
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel()
}
