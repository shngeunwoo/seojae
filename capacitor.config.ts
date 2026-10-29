import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.seojae.app",
  appName: "서재",
  webDir: "out",
  backgroundColor: "#f3efe6",
  android: {
    backgroundColor: "#f3efe6",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#f3efe6",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#f3efe6",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
}

export default config
