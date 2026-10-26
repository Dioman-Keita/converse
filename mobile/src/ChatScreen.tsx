import { useEffect, useRef } from "react"
import { BackHandler, KeyboardAvoidingView, Linking, StyleSheet } from "react-native"
import { WebView } from "react-native-webview"

import { colors } from "./theme"

type Props = {
  origin: string
  /** Back to the address screen (back button at the first page, or server gone). */
  onLeave: (lost: boolean) => void
}

/**
 * The web app itself, served by the Converse server — same interface as the site.
 * react-native-webview covers what a bare WebView doesn't: microphone permission
 * for voice notes, the file picker (photos, videos, documents) and downloads.
 */
export function ChatScreen({ origin, onLeave }: Props) {
  const webView = useRef<WebView>(null)
  const canGoBack = useRef(false)

  // Android back: navigate back inside the app, then return to the address screen.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack.current) webView.current?.goBack()
      else onLeave(false)
      return true
    })
    return () => sub.remove()
  }, [onLeave])

  return (
    // Edge-to-edge windows don't resize for the keyboard: pad so the composer stays visible.
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <WebView
        ref={webView}
        source={{ uri: `${origin}/chat` }}
        style={styles.web}
        containerStyle={styles.web}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled={false}
        allowFileAccess={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        applicationNameForUserAgent="ConverseAndroid"
        onNavigationStateChange={(state) => {
          canGoBack.current = state.canGoBack
        }}
        // Stay inside the app for the server's pages; open anything else in the browser.
        onShouldStartLoadWithRequest={(request) => {
          if (request.url.startsWith(origin) || request.url.startsWith("about:")) return true
          void Linking.openURL(request.url).catch(() => {})
          return false
        }}
        // The server is gone (stopped, or restarted with a new tunnel address).
        onError={() => onLeave(true)}
        onHttpError={(event) => {
          if (event.nativeEvent.statusCode >= 500 && event.nativeEvent.url.startsWith(origin)) onLeave(true)
        }}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  web: { flex: 1, backgroundColor: colors.background },
})
