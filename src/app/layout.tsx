import type { Metadata, Viewport } from "next"
import { Fraunces } from "next/font/google"
import { AppProvider } from "@/components/providers"
import "./globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  weight: ["500", "600", "700"],
})

const themeBoot = `(function(){try{var t="system";var raw=localStorage.getItem("seojae.v1");if(raw){var parsed=JSON.parse(raw);if(parsed&&parsed.settings&&parsed.settings.theme)t=parsed.settings.theme;}var dark=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var root=document.documentElement;root.classList.toggle("dark",dark);root.style.colorScheme=dark?"dark":"light";}catch(e){}})();`

export const metadata: Metadata = {
  title: {
    default: "서재",
    template: "%s · 서재",
  },
  description:
    "영어와 한국어를 한자리에서 외우는 단어장. 카드, 퀴즈, 받아쓰기, 듣기, 간격 반복.",
  applicationName: "서재",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3efe6" },
    { media: "(prefers-color-scheme: dark)", color: "#141714" },
  ],
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${fraunces.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-dvh">
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
