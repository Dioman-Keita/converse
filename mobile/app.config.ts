import type { ExpoConfig } from "expo/config"

// Version from the release tag (CI) or the build command; "1.2.3" → versionCode 10203,
// which always increases with the version so Android installs updates in place.
const version: string = process.env.VERSION_NAME ?? "0.0.0"
const versionCode = Math.max(
  1,
  version
    .split("-")[0]
    .split(".")
    .map((part: string) => Number.parseInt(part, 10) || 0)
    .reduce((code: number, part: number, i: number) => code + part * [10_000, 100, 1][i], 0),
)

const config: ExpoConfig = {
  name: "Converse",
  slug: "converse",
  version,
  orientation: "default",
  userInterfaceStyle: "dark",
  backgroundColor: "#0B0A12",
  icon: "./assets/icon.png",
  platforms: ["android"],
  android: {
    package: "app.converse",
    versionCode,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      monochromeImage: "./assets/adaptive-icon.png",
      backgroundColor: "#7C3AED",
    },
    permissions: [
      // Voice messages (asked only when recording starts).
      "android.permission.RECORD_AUDIO",
      "android.permission.MODIFY_AUDIO_SETTINGS",
      // Saving downloaded documents to Downloads before Android 10.
      "android.permission.WRITE_EXTERNAL_STORAGE",
    ],
    blockedPermissions: ["android.permission.CAMERA", "android.permission.SYSTEM_ALERT_WINDOW"],
  },
  plugins: [
    "expo-localization",
    [
      "expo-build-properties",
      {
        // The tunnel is HTTPS; plain HTTP lets a server on the local network be used too.
        android: { usesCleartextTraffic: true },
      },
    ],
    "./plugins/with-release-signing",
  ],
}

export default config
