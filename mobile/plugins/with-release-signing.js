// Signs release builds with the key from the environment (CI secrets or a local
// keystore) instead of the debug key Expo's generated project uses by default.
// Without ANDROID_KEYSTORE_PATH the release build stays debug-signed (local tests).
const { withAppBuildGradle } = require("expo/config-plugins")

const RELEASE_SIGNING = `
        release {
            if (System.getenv("ANDROID_KEYSTORE_PATH")) {
                storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }`

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents
    if (gradle.includes('System.getenv("ANDROID_KEYSTORE_PATH")')) return mod

    gradle = gradle.replace(/signingConfigs\s*\{/, (match) => `${match}${RELEASE_SIGNING}`)
    // The template's release build type uses the debug key: switch it when a key is provided.
    gradle = gradle.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
      '$1signingConfig System.getenv("ANDROID_KEYSTORE_PATH") ? signingConfigs.release : signingConfigs.debug',
    )
    if (!gradle.includes("signingConfigs.release : signingConfigs.debug")) {
      throw new Error("with-release-signing: release build type not found in app/build.gradle")
    }
    mod.modResults.contents = gradle
    return mod
  })
}
